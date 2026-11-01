import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../lib/format";
import { useDeleteReview, useMyReview } from "../../queries/reviews";
import Skeleton from "../ui/Skeleton";
import PhotoLightbox from "./PhotoLightbox";
import ReviewForm from "./ReviewForm";
import StarRating from "./StarRating";

const box = "rounded-md border border-gray-300 bg-white p-4 sm:p-5";

export default function MyReview({ productId }) {
    const { status } = useAuth();
    const location = useLocation();
    const authed = status === "authenticated";
    const { data, isPending } = useMyReview(productId, authed);
    const remove = useDeleteReview();
    const [editing, setEditing] = useState(false);
    const [viewing, setViewing] = useState(null); // index of the open photo

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
        const review = data.review;
        const images = review.images ?? [];

        return (
            <div className={box}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-semibold text-heading">Your review</span>
                        <StarRating value={review.rating} size={16} />
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

                <p className="mt-1 text-xs text-gray-500">
                    {formatDate(review.createdAt)}{review.updatedAt && " · Edited"}
                </p>

                {review.comment && (
                    <p className="mt-3 whitespace-pre-line wrap-break-word text-sm text-neutral-800">{review.comment}</p>
                )}

                {images.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                        {images.map((img, i) => (
                            <li key={img.id}>
                                <button
                                    type="button"
                                    onClick={() => setViewing(i)}
                                    aria-label={`View photo ${i + 1} of ${images.length}`}
                                    className="block size-20 overflow-hidden rounded-md border border-gray-300 hover:border-accent-100 focus-visible:outline-2 focus-visible:outline-accent-100"
                                >
                                    <img src={img.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {review.adminReply && (
                    <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
                        <p className="font-semibold text-heading">
                            Response from QuickCart
                            <span className="font-normal text-gray-500"> · {formatDate(review.repliedAt)}{review.replyEdited && " · Edited"}</span>
                        </p>
                        <p className="mt-1 whitespace-pre-line wrap-break-word text-neutral-800">{review.adminReply}</p>
                    </div>
                )}

                {viewing !== null && (
                    <PhotoLightbox images={images} index={viewing} onIndexChange={setViewing} onClose={() => setViewing(null)} />
                )}
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