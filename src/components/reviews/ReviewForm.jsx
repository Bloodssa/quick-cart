import { useState } from "react";
import { useCreateReview, useUpdateReview } from "../../queries/reviews";
import PhotoPicker, { MAX_PHOTOS } from "./PhotoPicker";
import StarInput from "./StarInput";

const MAX = 2000;

export default function ReviewForm({ productId, existing, onDone, onCancel }) {
    const [rating, setRating] = useState(existing?.rating ?? 0);
    const [comment, setComment] = useState(existing?.comment ?? "");
    const [kept, setKept] = useState(existing?.images ?? []);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState("");

    const create = useCreateReview();
    const update = useUpdateReview();
    const mutation = existing ? update : create;
    const saving = mutation.isPending;

    // existing photos the customer took off the form
    const removeImageIds = (existing?.images ?? [])
        .filter((i) => !kept.some((k) => k.id === i.id))
        .map((i) => i.id);

    function handleSubmit(e) {
        e.preventDefault();
        if (!rating) {
            setError("Choose a star rating.");
            return;
        }
        setError("");
        // errors are toasted by the mutation hook
        mutation.mutate(
            { productId, rating, comment: comment.trim(), images: files, removeImageIds },
            { onSuccess: onDone },
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
                <StarInput value={rating} onChange={(n) => { setRating(n); setError(""); }} disabled={saving} />
                {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <div>
                <label htmlFor="review-comment" className="text-sm font-medium text-heading">
                    Your review <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <textarea
                    id="review-comment"
                    rows={4}
                    maxLength={MAX}
                    value={comment}
                    disabled={saving}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike? How is the quality?"
                    className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-100"
                />
                <p className="mt-1 text-right text-xs text-gray-500">{comment.length}/{MAX}</p>
            </div>

            <PhotoPicker
                kept={kept}
                files={files}
                disabled={saving}
                onRemoveKept={(id) => setKept((prev) => prev.filter((i) => i.id !== id))}
                onAddFiles={(added) => setFiles((prev) => [...prev, ...added].slice(0, MAX_PHOTOS - kept.length))}
                onRemoveFile={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}
            />

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="h-10 rounded-md border border-gray-300 px-5 text-sm font-semibold text-heading hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    className="h-10 rounded-md bg-accent-100 px-6 text-sm font-semibold text-white hover:bg-accent-hover active:bg-accent-200 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                    {saving ? "Saving…" : existing ? "Save changes" : "Submit review"}
                </button>
            </div>
        </form>
    );
}