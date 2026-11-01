import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, MoveLeft } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import HomeLayout from "../../layouts/HomeLayout";
import Skeleton from "../../components/ui/Skeleton";
import AddressModal from "../../components/profile/AddressModal";
import { useCart } from "../../queries/cart";
import { useAddresses } from "../../queries/addresses";
import { usePlaceOrder, useShippingQuote } from "../../queries/orders";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatPrice } from "../../lib/format";
import ShippingNudge from "../../components/orders/ShippingNudge";

const PAYMENT_METHODS = [
    { value: "COD", label: "Cash on delivery", hint: "Pay when your order arrives." }, // cod for now
];

export default function Checkout() {
    useDocumentTitle("Checkout");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const ids = [
        ...new Set(
            (searchParams.get("items") ?? "")
                .split(",")
                .map(Number)
                .filter((n) => Number.isInteger(n) && n > 0)
        )
    ];

    const { data: cart, isPending: cartPending, error: cartError } = useCart();
    const { data: addresses = [], isPending: addressesPending } = useAddresses();
    const placeOrder = usePlaceOrder();

    const [pickedAddressId, setPickedAddressId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
    const [addressModalOpen, setAddressModalOpen] = useState(false);

    const items = (cart?.items ?? []).filter((item) => ids.includes(item.id));
    const missing = Boolean(cart) && items.length !== ids.length;
    const invalid = ids.length === 0 || (missing && !placeOrder.isSuccess);
    const loading = cartPending || addressesPending;

    const stockProblem = items.some((i) => i.stockQuantity === 0 || i.quantity > i.stockQuantity);

    // default to the default address until the user picks another
    const addressId = pickedAddressId ?? (addresses.find((a) => a.isDefault) ?? addresses[0])?.id ?? null;

    const subTotal = items.reduce((sum, i) => sum + i.subTotal, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    // the server works out the shipping fee from the chosen address and the subtotal
    const selectedAddress = addresses.find((a) => a.id === addressId);
    const { data: quote, isFetching: quoting } = useShippingQuote(
        { province: selectedAddress?.province, city: selectedAddress?.city, subtotal: subTotal },
        Boolean(selectedAddress) && subTotal > 0,
    );
    const total = subTotal + (quote?.payable ?? 0);

    const canPlace =
        !invalid && items.length > 0 && !stockProblem && addressId !== null &&
        !placeOrder.isPending && Boolean(quote) && !quoting;

    function handlePlaceOrder() {
        placeOrder.mutate(
            { addressId, paymentMethod, cartItemIds: ids },
            {
                onSuccess: (order) => {
                    toast.success("Order placed");
                    navigate(`/orders/${order.id}`, { replace: true });
                },
                onError: (err) => toast.error(getErrorMessage(err)),
            }
        );
    }

    return (
        <HomeLayout>
            <div className="flex items-center gap-3">
                <Link to="/cart" className="group flex size-11 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-neutral-900 transition-colors duration-200 hover:border-accent-100 hover:bg-accent-50 hover:text-accent-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-100">
                    <MoveLeft size={20} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
                </Link>
                <h1 className="text-3xl font-bold text-heading">Checkout</h1>
            </div>

            {loading && (
                <div role="status" className="mt-6 space-y-4">
                    <span className="sr-only">Loading checkout…</span>
                    <Skeleton className="h-40" />
                    <Skeleton className="h-28" />
                </div>
            )}

            {!loading && cartError && (
                <div role="alert" className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
                    {getErrorMessage(cartError)}
                </div>
            )}

            {!loading && !cartError && invalid && (
                <div className="mt-10 flex flex-col items-center gap-3 rounded-md border border-gray-300 py-16 text-center">
                    <p className="font-semibold text-heading">
                        {ids.length === 0 ? "No items selected" : "Some items are no longer in your cart"}
                    </p>
                    <Link
                        to="/cart"
                        className="rounded-md bg-accent-100 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
                    >
                        Back to cart
                    </Link>
                </div>
            )}

            {!loading && !cartError && !invalid && (
                <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
                    <div className="space-y-6">
                        {/* address */}
                        <section className="rounded-md border border-gray-300 bg-white p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-bold text-heading">1. Delivery address</h2>
                                <button
                                    type="button"
                                    onClick={() => setAddressModalOpen(true)}
                                    className="flex items-center gap-1 text-sm font-semibold text-accent-100 hover:text-accent-hover"
                                >
                                    <Plus size={16} aria-hidden="true" />
                                    Add new
                                </button>
                            </div>

                            {addresses.length === 0 ? (
                                <p className="mt-4 text-sm text-neutral-500">
                                    You have no saved address yet. Add one to continue.
                                </p>
                            ) : (
                                <div role="radiogroup" aria-label="Delivery address" className="mt-4 grid gap-3 md:grid-cols-2">
                                    {addresses.map((a) => (
                                        <label
                                            key={a.id}
                                            className={`flex cursor-pointer gap-3 rounded-md border p-4 transition-colors ${a.id === addressId
                                                ? "border-accent-100 bg-accent-50"
                                                : "border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="address"
                                                checked={a.id === addressId}
                                                onChange={() => setPickedAddressId(a.id)}
                                                className="mt-1 size-4 shrink-0 accent-accent-100"
                                            />
                                            <span className="min-w-0 text-sm">
                                                <span className="flex items-center gap-2 font-semibold text-heading">
                                                    {a.recipientName}
                                                    {a.isDefault && (
                                                        <span className="rounded-md bg-accent-50 px-2 py-0.5 text-xs text-accent-100">
                                                            Default
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="mt-0.5 block text-neutral-500">{a.contactNumber}</span>
                                                <span className="mt-1 block text-neutral-500">
                                                    {a.addressLine}, {a.barangay}, {a.city}, {a.province} {a.postalCode}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* payment */}
                        <section className="rounded-md border border-gray-300 bg-white p-5">
                            <h2 className="font-bold text-heading">2. Payment method</h2>
                            <div role="radiogroup" aria-label="Payment method" className="mt-4 grid gap-3 md:grid-cols-2">
                                {PAYMENT_METHODS.map((method) => (
                                    <label
                                        key={method.value}
                                        className={`flex cursor-pointer gap-3 rounded-md border p-4 transition-colors ${method.value === paymentMethod
                                            ? "border-accent-100 bg-accent-50"
                                            : "border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={method.value === paymentMethod}
                                            onChange={() => setPaymentMethod(method.value)}
                                            className="mt-1 size-4 shrink-0 accent-accent-100"
                                        />
                                        <span className="text-sm">
                                            <span className="block font-semibold text-heading">{method.label}</span>
                                            <span className="block text-neutral-500">{method.hint}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* items */}
                        <section className="rounded-md border border-gray-300 bg-white p-5">
                            <h2 className="font-bold text-heading">
                                3. Review {items.length === 1 ? "item" : `${items.length} items`}
                            </h2>
                            <ul className="mt-2 divide-y divide-gray-200">
                                {items.map((item) => (
                                    <li key={item.id} className="flex gap-4 py-4">
                                        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-300">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-1" />
                                            ) : (
                                                <span className="text-xs text-neutral-500">No image</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 font-semibold text-heading">{item.productName}</p>
                                            <p className="mt-0.5 text-sm text-neutral-500">
                                                {formatPrice(item.unitPrice)} x {item.quantity}
                                            </p>
                                            {(item.stockQuantity === 0 || item.quantity > item.stockQuantity) && (
                                                <p className="mt-0.5 text-xs font-medium text-red-600">
                                                    Not enough stock. Update your cart to continue.
                                                </p>
                                            )}
                                        </div>
                                        <p className="shrink-0 font-bold text-heading">{formatPrice(item.subTotal)}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* summary */}
                    <aside className="h-fit rounded-md border border-gray-300 bg-white p-5 lg:sticky lg:top-6">
                        <h2 className="font-bold text-heading">Order Summary</h2>

                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-neutral-500">Items ({itemCount})</dt>
                                <dd className="font-medium">{formatPrice(subTotal)}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-neutral-500">Shipping fee{quote && ` (${quote.zoneLabel})`}</dt>
                                <dd className="font-medium">{quote ? formatPrice(quote.fee) : "…"}</dd>
                            </div>
                            {quote?.discount > 0 && (
                                <div className="flex justify-between gap-3 text-green-600">
                                    <dt>
                                        Shipping discount
                                        {quote.discount >= quote.fee && " (free shipping)"}
                                    </dt>
                                    <dd className="font-medium">−{formatPrice(quote.discount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
                                <dt className="font-semibold">Total</dt>
                                <dd className="font-bold text-heading">{quote ? formatPrice(total) : "…"}</dd>
                            </div>
                        </dl>

                        <ShippingNudge quote={quote} subtotal={subTotal} />

                        <button
                            type="button"
                            disabled={!canPlace}
                            onClick={handlePlaceOrder}
                            className="mt-5 h-11 w-full rounded-md bg-accent-100 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {placeOrder.isPending ? "Placing order…" : "Place order"}
                        </button>

                        {addressId === null && (
                            <p className="mt-2 text-center text-xs text-amber-600">Add a delivery address to continue.</p>
                        )}
                        {stockProblem && (
                            <p className="mt-2 text-center text-xs text-amber-600">Fix the stock problems above first.</p>
                        )}

                        <Link to="/cart" className="mt-3 block text-center text-sm font-semibold text-neutral-500 hover:text-accent-100">
                            Back to cart
                        </Link>
                    </aside>
                </div>
            )}

            {addressModalOpen && <AddressModal address={null} onClose={() => setAddressModalOpen(false)} />}
        </HomeLayout>
    );
}