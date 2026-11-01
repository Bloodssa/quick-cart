import { Link } from "react-router-dom";
import { formatDate } from "../../lib/format";
import { Card } from "../admin/ui";
import StarRating from "../reviews/StarRating";

export default function ReviewsToAnswer({ reviews, loading }) {
    const needs = reviews?.needsReply ?? 0;
    const low = reviews?.lowRatedNeedsReply ?? 0;
    const latest = reviews?.latest ?? [];

    return (
        <Card className="min-w-0 p-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold">Reviews to answer{needs > 0 && ` (${needs})`}</h2>
                <Link to="/admin/reviews?filter=needsReply" className="text-sm font-semibold text-accent-300 hover:underline">
                    All reviews
                </Link>
            </div>

            <p className="mt-1 text-xs text-gray-600">
                {reviews && reviews.count30d > 0
                    ? `${reviews.average30d.toFixed(1)} average from ${reviews.count30d} ${reviews.count30d === 1 ? "review" : "reviews"} in 30 days`
                    : "No reviews in the last 30 days"}
                {low > 0 && <span className="font-semibold text-red-600"> · {low} low-rated</span>}
            </p>

            {loading ? (
                <div className="mt-4 h-32 animate-pulse rounded-md bg-gray-100" />
            ) : latest.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">You're all caught up. Nothing is waiting for a reply.</p>
            ) : (
                <ul className="mt-3 divide-y divide-gray-200">
                    {latest.map((r) => (
                        <li key={r.id}>
                            <Link to="/admin/reviews?filter=needsReply" className="flex flex-col gap-1 py-3 hover:bg-gray-50">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="truncate text-sm font-semibold text-heading">{r.productName}</span>
                                    <StarRating value={r.rating} size={14} />
                                </div>
                                {r.comment && <p className="line-clamp-2 wrap-break-word text-sm text-neutral-700">{r.comment}</p>}
                                <p className="text-xs text-gray-500">{r.customerName} · {formatDate(r.createdAt)}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}