import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { formatDate } from "../../lib/format";
import PhotoLightbox from "./PhotoLightbox";
import StarRating from "./StarRating";

export default function ReviewItem({ review }) {
    const [viewing, setViewing] = useState(null); // index of the open photo
    const images = review.images ?? [];

    return (
        <li className="flex gap-3 py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-sm font-bold uppercase text-accent-300" aria-hidden="true">
                {review.reviewerName[0]}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-semibold text-heading">{review.reviewerName}</span>
                    {review.isMine && <span className="rounded-md bg-accent-50 px-1.5 py-0.5 text-xs font-semibold text-accent-300">You</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StarRating value={review.rating} size={14} />
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <BadgeCheck size={14} aria-hidden="true" /> Verified purchase
                    </span>
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
            </div>

            {viewing !== null && (
                <PhotoLightbox images={images} index={viewing} onIndexChange={setViewing} onClose={() => setViewing(null)} />
            )}
        </li>
    );
}