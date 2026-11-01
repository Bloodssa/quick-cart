import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { formatPrice } from "../../lib/format";
import { useAddToCart } from "../../queries/cart";
import { useReviewSummary } from "../../queries/reviews";
import QuantityStepper from "../cart/QuantityStepper";
import StarRating from "../reviews/StarRating";
import ProductDescription from "./ProductDescription";

const MAX_PER_ITEM = 99;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-100";

export default function ProductInfo({
    id,
    name,
    categoryName,
    price,
    stockQuantity,
    description
}) {
    const { status } = useAuth(); // check for user is authenticated
    const navigate = useNavigate();
    const location = useLocation();
    const addToCart = useAddToCart();
    const { data: ratings } = useReviewSummary(id); // shares the cache with the reviews section
    const [quantity, setQuantity] = useState(1);
    const [pending, setPending] = useState(null); // cart or buy

    const inStock = stockQuantity > 0;
    const lowStock = inStock && stockQuantity <= 10;
    const maxQuantity = Math.min(stockQuantity, MAX_PER_ITEM);
    const safeQuantity = Math.min(Math.max(quantity, 1), Math.max(maxQuantity, 1));

    function requireLogin() {
        if (status === "loading") return false;

        if (status !== "authenticated") {
            toast.info("Please log in to continue.");
            navigate("/login", { state: { from: location } });
            return false;
        }

        return true;
    }

    function handleAddToCart() {
        if (!requireLogin()) {
             navigate("/login");
            return;
        }
        
        setPending("cart");
        addToCart.mutate(
            { productId: id, quantity: safeQuantity },
            {
                onSuccess: () => toast.success(`${name} added to cart`),
                onError: (err) => toast.error(getErrorMessage(err)),
                onSettled: () => setPending(null),
            },
        );
    }

    function handleOrderNow() {
        if (!requireLogin()) return;

        setPending("buy");
        addToCart.mutate(
            { productId: id, quantity: safeQuantity },
            {
                onSuccess: (result) => {
                    const cartItem = result?.items?.find((item) => item.productId === id) ?? result;

                    if (cartItem?.id) navigate(`/checkout?items=${cartItem.id}`);
                    else navigate("/cart"); // fallback: the user click the item there
                },
                onError: (err) => toast.error(getErrorMessage(err)),
                onSettled: () => setPending(null),
            },
        );
    }

    return (
        <div className="min-w-0">
            {categoryName && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{categoryName}</span>
            )}

            <h1 className="mt-3 text-3xl leading-tight font-bold text-heading">{name}</h1>

            {ratings && (
                <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-accent-100">
                    {ratings.total > 0 ? (
                        <>
                            <span className="font-semibold text-heading">{ratings.average.toFixed(1)}</span>
                            <StarRating value={ratings.average} />
                            <span>({ratings.total} {ratings.total === 1 ? "review" : "reviews"})</span>
                        </>
                    ) : "No reviews yet"}
                </a>
            )}

            <p className="mt-5 border-t border-gray-200 pt-5 text-3xl font-bold text-heading">
                {formatPrice(price)}
            </p>
            <p role="status" className={`mt-2 text-sm ${inStock && !lowStock ? "text-green-600" : "font-semibold text-red-500"}`}>
                {!inStock ? "Out of stock" : lowStock ? `Only ${stockQuantity} left. Don't miss it` : `In stock (${stockQuantity} available)`}
            </p>

            <div className="mt-6 border-t border-gray-200 pt-6">
                {inStock && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-heading">Quantity</span>
                        <QuantityStepper
                            value={safeQuantity}
                            max={maxQuantity}
                            disabled={addToCart.isPending}
                            onChange={setQuantity}
                        />
                    </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={handleOrderNow}
                        disabled={!inStock || addToCart.isPending}
                        className={`flex h-11 items-center justify-center gap-2 rounded-md border border-gray-300 px-6 text-sm font-semibold text-heading transition-colors hover:border-accent-100 hover:bg-accent-50 hover:text-accent-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-heading ${focusRing}`}
                    >
                        <Zap size={16} aria-hidden="true" />
                        {pending === "buy" ? "Please wait…" : "Order now"}
                    </button>
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!inStock || addToCart.isPending}
                        className={`flex h-11 items-center justify-center gap-2 rounded-md bg-accent-100 px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover active:bg-accent-200 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${focusRing}`}
                    >
                        <ShoppingCart size={16} aria-hidden="true" />
                        {pending === "cart" ? "Adding…" : "Add to cart"}
                    </button>
                </div>
            </div>

            <ProductDescription description={description} />
        </div>
    );
}