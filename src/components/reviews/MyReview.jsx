import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useDeleteReview, useMyReview } from "../../queries/reviews";
import Skeleton from "../ui/Skeleton";
import ReviewForm from "./ReviewForm";
import StarRating from "./StarRating";

const box = "rounded-md border border-gray-300 bg-gray-50 p-4 sm:p-5";

export default function MyReview({ productId }) {
    const { status } = useAuth();
    const location = useLocation();
    const authed = status === "authenticated";
    const { data, isPending } = useMyReview(productId, authed);
    const remove = useDeleteReview();
    const [editing, setEditing] = useState(false);

    if (status === "loading") return null;

    if (!authed) {
        return (
            <div className={box}>
                <p className="text-sm text-gray-700">
                    <Link to="/login" state={{ from: location }} className="font-semibold text-accent-100 hover:underline">Log in</Link>
                    {" "}to review products you've bought.
                </p>
            </div>
        );
    }

    if (isPending) return <Skeleton className="h-20" />;
    if (!data) return null;

    if (data.review && !editing) {
        return (
            <div className={`${box} flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-heading">Your review</span>
                    <StarRating value={data.review.rating} size={16} />
                </div>
                <div className="flex gap-4 text-sm font-semibold">
                    <button type="button" onClick={() => setEditing(true)} className="text-accent-100 hover:underline">Edit</button>
                    <button
                        type="button"
                        disabled={remove.isPending}
                        onClick={() => window.confirm("Delete your review?") && remove.mutate(productId)}
                        className="text-red-600 hover:underline disabled:opacity-50"
                    >
                        Delete
                    </button>
                </div>
            </div>
        );
    }

    if (data.review || data.purchased) {
        return (
            <div className={box}>
                <h3 className="mb-3 font-semibold text-heading">{data.review ? "Edit your review" : "Write a review"}</h3>
                <ReviewForm
                    productId={productId}
                    existing={data.review}
                    onDone={() => setEditing(false)}
                    onCancel={data.review ? () => setEditing(false) : undefined}
                />
            </div>
        );
    }

    return (
        <div className={box}>
            <p className="text-sm text-gray-700">Only customers who have received this product can review it.</p>
        </div>
    );
}