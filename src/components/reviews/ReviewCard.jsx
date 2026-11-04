import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import { formatDate } from "../../lib/format";
import { useAdminDeleteReview, useDeleteReply, useReplyToReview } from "../../queries/adminReviews";
import PhotoLightbox from "../reviews/PhotoLightbox";
import StarRating from "../reviews/StarRating";
import { ConfirmModal, useModal } from "../ui/AppModal";
import { inputCls, primaryBtn, secondaryBtn } from "../admin/ui";

const MAX_REPLY = 1000;

function ReplyForm({ review, onDone }) {
    const [text, setText] = useState(review.adminReply ?? "");
    const reply = useReplyToReview();
    const empty = text.trim().length === 0;

    function submit(e) {
        e.preventDefault();
        if (empty) return;
        reply.mutate({ id: review.id, reply: text.trim() }, { onSuccess: onDone });
    }

    return (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <label htmlFor={`reply-${review.id}`} className="sr-only">Your reply</label>
            <textarea
                id={`reply-${review.id}`}
                rows={3}
                maxLength={MAX_REPLY}
                value={text}
                disabled={reply.isPending}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a public reply. The customer and every shopper will see it."
                className={`${inputCls} h-auto py-2`}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-gray-500">{text.length}/{MAX_REPLY}</span>
                <div className="flex gap-3">
                    <button type="button" onClick={onDone} disabled={reply.isPending} className={secondaryBtn}>Cancel</button>
                    <button type="submit" disabled={empty || reply.isPending} className={primaryBtn}>
                        {reply.isPending ? "Saving…" : review.adminReply ? "Save changes" : "Post reply"}
                    </button>
                </div>
            </div>
        </form>
    );
}

export default function ReviewCard({ review }) {
    const [replying, setReplying] = useState(false);
    const [viewing, setViewing] = useState(null);
    const removeReply = useDeleteReply();
    const removeReview = useAdminDeleteReview();
    const deleteReviewModal = useModal();
    const deleteReplyModal = useModal();
    const images = review.images ?? [];

    function confirmDeleteReview() {
        removeReview.mutate(review.id, {
            onSuccess: () => {
                deleteReviewModal.close();
                toast.success("Review deleted");
            },
            onError: (err) => {
                deleteReviewModal.close();
                toast.error(getErrorMessage(err));
            },
        });
    }

    function confirmDeleteReply() {
        removeReply.mutate(review.id, {
            onSuccess: () => {
                deleteReplyModal.close();
                toast.success("Reply deleted");
            },
            onError: (err) => {
                deleteReplyModal.close();
                toast.error(getErrorMessage(err));
            },
        });
    }

    return (
        <li className="rounded-md border border-gray-300 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <Link to={`/products/${review.productId}`} className="font-semibold text-heading hover:underline">
                        {review.productName}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                        <StarRating value={review.rating} size={14} />
                        <span>{review.customerName}</span>
                        <span>{formatDate(review.createdAt)}</span>
                    </div>
                </div>
                <button
                    type="button"
                    disabled={removeReview.isPending}
                    onClick={deleteReviewModal.open}
                    className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                    Delete review
                </button>
            </div>

            {review.comment
                ? <p className="mt-3 whitespace-pre-line wrap-break-word text-sm text-neutral-800">{review.comment}</p>
                : <p className="mt-3 text-sm italic text-gray-500">Rating only, no comment.</p>}

            {images.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                    {images.map((img, i) => (
                        <li key={img.id}>
                            <button type="button" onClick={() => setViewing(i)} aria-label={`View photo ${i + 1} of ${images.length}`}
                                className="block size-20 overflow-hidden rounded-md border border-gray-300 hover:border-accent-100">
                                <img src={img.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-4 border-t border-gray-200 pt-4">
                {replying ? (
                    <ReplyForm review={review} onDone={() => setReplying(false)} />
                ) : review.adminReply ? (
                    <div className="rounded-md bg-gray-50 p-3 text-sm">
                        <p className="font-semibold text-heading">
                            Your reply
                            <span className="font-normal text-gray-500"> · {formatDate(review.repliedAt)}{review.replyEdited && " · Edited"}</span>
                        </p>
                        <p className="mt-1 whitespace-pre-line wrap-break-word text-neutral-800">{review.adminReply}</p>
                        <div className="mt-2 flex gap-4 font-semibold">
                            <button type="button" onClick={() => setReplying(true)} className="text-accent-300 hover:underline">Edit</button>
                            <button
                                type="button"
                                disabled={removeReply.isPending}
                                onClick={deleteReplyModal.open}
                                className="text-red-600 hover:underline disabled:opacity-50"
                            >
                                Delete reply
                            </button>
                        </div>
                    </div>
                ) : (
                    <button type="button" onClick={() => setReplying(true)} className={secondaryBtn}>Reply</button>
                )}
            </div>

            {viewing !== null && (
                <PhotoLightbox images={images} index={viewing} onIndexChange={setViewing} onClose={() => setViewing(null)} />
            )}

            {/* Delete review */}
            <ConfirmModal
                isOpen={deleteReviewModal.isOpen}
                onClose={deleteReviewModal.close}
                onConfirm={confirmDeleteReview}
                destructive
                icon={Trash2}
                title="Delete this review?"
                message={
                    <>
                        The review by <span className="font-semibold text-heading">{review.customerName}</span> on{" "}
                        <span className="font-semibold text-heading">{review.productName}</span> will be permanently
                        removed. Only do this for spam or abuse. This can't be undone.
                    </>
                }
                confirmLabel="Delete review"
                pendingLabel="Deleting…"
                isPending={removeReview.isPending}
            />

            {/* Delete reply */}
            <ConfirmModal
                isOpen={deleteReplyModal.isOpen}
                onClose={deleteReplyModal.close}
                onConfirm={confirmDeleteReply}
                destructive
                icon={MessageSquare}
                title="Delete your reply?"
                message="Your public reply will be removed from this review. You can write a new one afterwards."
                confirmLabel="Delete reply"
                pendingLabel="Deleting…"
                isPending={removeReply.isPending}
            />
        </li>
    );
}