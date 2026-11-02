import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, MoveLeft, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import HomeLayout from "../../layouts/HomeLayout";
import Skeleton from "../../components/ui/Skeleton";
import AddressModal from "../../components/profile/AddressModal";
import { useCart } from "../../queries/cart";
import { useAddresses } from "../../queries/addresses";
import { usePlaceOrder, useOrderPreview } from "../../queries/orders";
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

    // voucher: what is typed, and the code the server is asked to check
    const [voucherInput, setVoucherInput] = useState("");
    const [voucherCode, setVoucherCode] = useState("");

    const items = (cart?.items ?? []).filter((item) => ids.includes(item.id));
    const missing = Boolean(cart) && items.length !== ids.length;
    const invalid = ids.length === 0 || (missing && !placeOrder.isSuccess);
    const loading = cartPending || addressesPending;

    const stockProblem = items.some((i) => i.stockQuantity === 0 || i.quantity > i.stockQuantity);

    // default to the default address until the user picks another
    const addressId = pickedAddressId ?? (addresses.find((a) => a.isDefault) ?? addresses[0])?.id ?? null;

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const cartSubTotal = items.reduce((sum, i) => sum + i.subTotal, 0);

    // the server prices everything: product deals, the voucher check, shipping and the total
    const { data: preview, isFetching: previewing } = useOrderPreview(
        { addressId, cartItemIds: ids, voucherCode: voucherCode || null },
        addressId !== null && ids.length > 0 && items.length === ids.length,
    );

    const lineById = new Map((preview?.items ?? []).map((l) => [l.cartItemId, l]));
    const productSavings = preview?.productSavings ?? 0;
    const itemsTotal = preview ? preview.subTotal + productSavings : cartSubTotal;
    const voucherDiscount = preview?.voucherDiscount ?? 0;
    const shippingQuote = preview?.shipping;

    const voucherState = !voucherCode
        ? "none"
        : previewing
            ? "checking"
            : preview?.voucherError
                ? "refused"
                : "applied";

    const canPlace =
        !invalid && items.length > 0 && !stockProblem && addressId !== null &&
        !placeOrder.isPending && Boolean(preview) && !previewing && voucherState !== "refused";

    function applyVoucher(e) {
        e.preventDefault();
        setVoucherCode(voucherInput.trim());
    }

    function removeVoucher() {
        setVoucherCode("");
        setVoucherInput("");
    }

    function handlePlaceOrder() {
        placeOrder.mutate(
            // only an accepted code is sent
            { addressId, paymentMethod, cartItemIds: ids, voucherCode: preview?.voucherCode ?? null },
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
                                {items.map((item) => {
                                    const line = lineById.get(item.id);
                                    const unitPrice = line?.unitPrice ?? item.unitPrice;
                                    const lineTotal = line?.subTotal ?? item.subTotal;
                                    const onDeal = (line?.discountPercent ?? 0) > 0;

                                    return (
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
                                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-neutral-500">
                                                    <span>{formatPrice(unitPrice)} x {item.quantity}</span>
                                                    {onDeal && (
                                                        <>
                                                            <s>{formatPrice(line.regularPrice)}</s>
                                                            <span className="rounded-md border border-accent-100 bg-accent-50 px-1.5 py-0.5 text-xs font-semibold text-heading">
                                                                -{line.discountPercent}%
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                                {(item.stockQuantity === 0 || item.quantity > item.stockQuantity) && (
                                                    <p className="mt-0.5 text-xs font-medium text-red-600">
                                                        Not enough stock. Update your cart to continue.
                                                    </p>
                                                )}
                                            </div>
                                            <p className="shrink-0 font-bold text-heading">{formatPrice(lineTotal)}</p>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    </div>

                    {/* summary */}
                    <aside className="h-fit rounded-md border border-gray-300 bg-white p-5 lg:sticky lg:top-6">
                        <h2 className="font-bold text-heading">Order Summary</h2>

                        {/* voucher */}
                        <div className="mt-4">
                            <p className="text-sm font-semibold text-heading">Voucher</p>

                            {voucherState === "none" ? (
                                <form onSubmit={applyVoucher} className="mt-2 flex gap-2">
                                    <input
                                        aria-label="Voucher code"
                                        value={voucherInput}
                                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                                        maxLength={20}
                                        placeholder="Enter code"
                                        className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-heading placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-100"
                                    />
                                    <button
                                        type="submit"
                                        disabled={voucherInput.trim().length < 4}
                                        className="h-10 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-heading hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Apply
                                    </button>
                                </form>
                            ) : (
                                <>
                                    <div
                                        className={`mt-2 flex items-center justify-between gap-2 rounded-md border p-3 text-sm ${voucherState === "applied"
                                            ? "border-accent-100 bg-accent-50"
                                            : voucherState === "refused"
                                                ? "border-red-300 bg-red-50"
                                                : "border-gray-300 bg-gray-50"
                                            }`}
                                    >
                                        <span className="flex min-w-0 items-center gap-2 font-semibold text-heading">
                                            <Ticket size={16} className="shrink-0 text-accent-100" aria-hidden="true" />
                                            <span className="truncate">{voucherCode}</span>
                                            {voucherState === "checking" && (
                                                <span className="text-xs font-normal text-neutral-500">Checking…</span>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={removeVoucher}
                                            aria-label="Remove voucher"
                                            className="rounded-md p-1 text-neutral-500 hover:bg-white hover:text-heading focus-visible:outline-2 focus-visible:outline-accent-100"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {voucherState === "refused" && (
                                        <p role="alert" className="mt-2 text-xs text-red-600">{preview.voucherError}</p>
                                    )}
                                </>
                            )}
                        </div>

                        <dl className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-neutral-500">Items ({itemCount})</dt>
                                <dd className="font-medium">{formatPrice(itemsTotal)}</dd>
                            </div>
                            {productSavings > 0 && (
                                <div className="flex justify-between gap-3 text-green-600">
                                    <dt>Deal savings</dt>
                                    <dd className="font-medium">−{formatPrice(productSavings)}</dd>
                                </div>
                            )}
                            {voucherDiscount > 0 && (
                                <div className="flex justify-between gap-3 text-green-600">
                                    <dt>Voucher ({preview.voucherCode})</dt>
                                    <dd className="font-medium">−{formatPrice(voucherDiscount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between gap-3">
                                <dt className="text-neutral-500">Shipping fee{shippingQuote && ` (${shippingQuote.zoneLabel})`}</dt>
                                <dd className="font-medium">{shippingQuote ? formatPrice(shippingQuote.fee) : "…"}</dd>
                            </div>
                            {shippingQuote?.discount > 0 && (
                                <div className="flex justify-between gap-3 text-green-600">
                                    <dt>
                                        Shipping discount
                                        {shippingQuote.discount >= shippingQuote.fee && " (free shipping)"}
                                    </dt>
                                    <dd className="font-medium">−{formatPrice(shippingQuote.discount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
                                <dt className="font-semibold">Total</dt>
                                <dd className="font-bold text-heading">{preview ? formatPrice(preview.total) : "…"}</dd>
                            </div>
                        </dl>

                        <ShippingNudge quote={shippingQuote} subtotal={preview?.subTotal ?? cartSubTotal} />

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
                        {voucherState === "refused" && (
                            <p className="mt-2 text-center text-xs text-amber-600">Fix or remove the voucher code to continue.</p>
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