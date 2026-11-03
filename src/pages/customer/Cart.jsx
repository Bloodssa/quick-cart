import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import CartItemRow from "../../components/cart/CartItemRow";
import CartSummary from "../../components/cart/CartSummary";
import Skeleton from "../../components/ui/Skeleton";
import HomeLayout from "../../layouts/HomeLayout";
import { useCart, useRemoveCartItem, useUpdateCartItem } from "../../queries/cart";
import RelatedProducts from "../../components/products/RelatedProducts";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import Checkbox from "../../components/ui/Checkbox";
import { useCartSelection } from "../../hooks/useCartSelection";
import GuestCartPrompt from "../../components/cart/GuestCartPrompt";
import { useAuth } from "../../hooks/useAuth";
import { formatPrice } from "../../lib/format";
import AppModal, { modalBtn, useModal } from "../../components/ui/AppModal";

const Cart = () => {
    useDocumentTitle("Cart");
    const { data: cart, isPending, error, refetch } = useCart();
    const { status } = useAuth();
    const isGuest = status === "anonymous";
    const isAuthed = status === "authenticated";

    const showSkeleton = status === "loading" || (isAuthed && isPending);

    const updateItem = useUpdateCartItem();
    const removeItem = useRemoveCartItem();

    const busy = updateItem.isPending || removeItem.isPending;

    const selection = useCartSelection(cart?.items ?? []);
    const navigate = useNavigate();
    const confirm = useModal();

    // a check product with problem in stockQQuantity wll be rejected
    const hasStockProblem = selection.selected.some((item) => item.quantity > item.stockQuantity);

    function handleQuantityChange(item, quantity) {
        updateItem.mutate(
            { itemId: item.id, quantity },
            { onError: (err) => toast.error(getErrorMessage(err)) }
        );
    }

    function handleRemove(item) {
        removeItem.mutate(item.id, {
            onSuccess: () => toast.success(`${item.productName} removed`),
            onError: (err) => toast.error(getErrorMessage(err)),
        });
    }

    function handleCheckout() {
        if (selection.selected.length === 0) {
            toast.error("Please select at least one item to checkout.");
            return;
        }

        if (hasStockProblem) {
            toast.error("Some selected items exceed available stock.");
            return;
        }

        confirm.open(); // let the customer verify first
    }

    function proceedToCheckout() {
        const ids = selection.selected.map((item) => item.id).join(",");
        confirm.close();
        navigate(`/checkout?items=${ids}`);
    }

    return (
        <HomeLayout>
            <h1 className="text-3xl font-bold text-heading">
                Shopping cart
            </h1>

            {/* Unauth or cuest */}
            {isGuest && <GuestCartPrompt />}

            {/* Skeleton loader */}
            {showSkeleton && (
                <div role="status" className="mt-6 space-y-4">
                    <span className="sr-only">Loading your cart…</span>
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
            )}

            {/* req failed to reach server */}
            {isAuthed && error && (
                <div role="alert" className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-600">
                    {getErrorMessage(error)}{" "}
                    <button type="button" onClick={() => refetch()} className="font-semibold underline">
                        Try again
                    </button>
                </div>
            )}

            {/* empty state */}
            {isAuthed && cart && cart.items.length === 0 && (
                <div className="mt-10 flex flex-col items-center gap-3 rounded-md border border-dashed border-gray-300 py-16 text-center">
                    <ShoppingCart size={36} aria-hidden="true" className="text-neutral-300" />
                    <p className="font-semibold text-heading">Your cart is empty</p>
                    <Link to="/products" className="rounded-md bg-accent-100 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover">
                        Start shopping
                    </Link>
                </div>
            )}

            {isAuthed && cart && cart.items.length > 0 && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div>
                        {/* select-all */}
                        <div className="flex items-center justify-between rounded-md border border-gray-300 bg-white px-5 py-3">
                            <label className="flex cursor-pointer items-center gap-4 text-sm font-semibold text-heading">
                                <Checkbox
                                    checked={selection.allSelected}
                                    disabled={selection.selectableCount === 0 || busy}
                                    onChange={selection.toggleAll}
                                />
                                Select all ({selection.selectableCount})
                            </label>
                            <span className="text-sm text-neutral-500">{selection.selected.length} selected</span>
                        </div>

                        <ul className="mt-3 divide-y divide-gray-200 rounded-md border border-gray-300 bg-white px-5">
                            {cart.items.map((item) => (
                                <CartItemRow
                                    key={item.id}
                                    item={item}
                                    selected={selection.isSelected(item)}
                                    busy={busy}
                                    onToggleSelect={selection.toggle}
                                    onQuantityChange={handleQuantityChange}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </ul>
                    </div>

                    <CartSummary
                        selectedQuantity={selection.selectedQuantity}
                        subTotal={selection.selectedSubTotal}
                        disabled={selection.selected.length === 0 || hasStockProblem || busy}
                        warning={hasStockProblem ? "Lower the quantity of the highlighted items to continue." : selection.selected.length === 0
                            ? "Select at least one item to check out." : null
                        }
                        onCheckout={handleCheckout}
                    />
                </div>
            )}

            {/* confirm before going to checkout */}
            <AppModal
                isOpen={confirm.isOpen}
                onClose={confirm.close}
                icon={ShoppingBag}
                variant="accent"
                title="Review your selection"
                description="Make sure these are the items you want to check out."
                footer={
                    <>
                        <button type="button" onClick={confirm.close} className={modalBtn.secondary}>
                            Back to cart
                        </button>
                        <button type="button" onClick={proceedToCheckout} className={modalBtn.primary}>
                            Continue to checkout
                        </button>
                    </>
                }
            >
                <ul className="divide-y divide-gray-200">
                    {selection.selected.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-3">
                            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-300">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-1" />
                                ) : (
                                    <span className="text-[10px] text-neutral-500">No image</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 font-semibold text-heading">{item.productName}</p>
                                <p className="text-xs text-neutral-500">
                                    {formatPrice(item.unitPrice)} x {item.quantity}
                                </p>
                            </div>
                            <p className="shrink-0 font-bold text-heading">{formatPrice(item.subTotal)}</p>
                        </li>
                    ))}
                </ul>

                <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-sm">
                    <span className="text-neutral-500">
                        Subtotal ({selection.selectedQuantity} {selection.selectedQuantity === 1 ? "item" : "items"})
                    </span>
                    <span className="font-bold text-heading">{formatPrice(selection.selectedSubTotal)}</span>
                </div>
                <p className="mt-2 text-xs text-neutral-500">Deals, vouchers and shipping are worked out at checkout.</p>
            </AppModal>

            <RelatedProducts
                title="You may also like"
                params={{ sort: "popular" }}
                excludeIds={cart?.items.map((item) => item.productId) ?? []}
            />
        </HomeLayout>
    );
};

export default Cart;