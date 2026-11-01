import { useState } from "react";
import { getErrorMessage } from "../../api/client";
import { useReviews, useReviewSummary } from "../../queries/reviews";
import Skeleton from "../ui/Skeleton";
import MyReview from "./MyReview";
import RatingSummary from "./RatingSummary";
import ReviewItem from "./ReviewItem";

const PAGE_SIZE = 10;
const SORTS = [["newest", "Newest"], ["highest", "Highest rating"], ["lowest", "Lowest rating"]];
const chip = (active) =>
    `rounded-full border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-accent-100 bg-accent-50 text-accent-300" : "border-gray-300 hover:bg-gray-50"}`;

export default function ReviewsSection({ productId }) {
    const [rating, setRating] = useState(null);
    const [withPhotos, setWithPhotos] = useState(false);
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    const summary = useReviewSummary(productId);
    const list = useReviews(productId, { rating, withPhotos: withPhotos || undefined, sort, page, pageSize: PAGE_SIZE });

    const reviews = list.data?.reviews ?? [];
    const totalPages = Math.max(1, Math.ceil((list.data?.totalResults ?? 0) / PAGE_SIZE));
    const total = summary.data?.total ?? 0;

    const selectRating = (value) => { setRating(value); setPage(1); };
    const selectPhotos = (value) => { setWithPhotos(value); setPage(1); };

    return (
        <section id="reviews" aria-labelledby="reviews-title" className="mt-12 scroll-mt-6 border-t border-gray-200 pt-8">
            <h2 id="reviews-title" className="text-2xl font-bold text-heading">Customer reviews</h2>

            <div className="mt-6 flex flex-col gap-6">
                {summary.isPending ? (
                    <Skeleton className="h-32" />
                ) : summary.data && total > 0 ? (
                    <RatingSummary summary={summary.data} selected={rating} onSelect={selectRating} />
                ) : (
                    <p className="text-sm text-gray-600">No reviews yet. Be the first to share your experience.</p>
                )}

                <MyReview productId={productId} />
            </div>

            {total > 0 && (
                <div className="mt-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <button type="button" aria-pressed={!withPhotos} onClick={() => selectPhotos(false)} className={chip(!withPhotos)}>
                                All
                            </button>
                            <button
                                type="button"
                                aria-pressed={withPhotos}
                                disabled={!withPhotos && !summary.data?.withPhotos}
                                onClick={() => selectPhotos(true)}
                                className={chip(withPhotos)}
                            >
                                With photos ({summary.data?.withPhotos ?? 0})
                            </button>
                            {rating && (
                                <span className="text-gray-600">
                                    {rating}-star only ·{" "}
                                    <button type="button" onClick={() => selectRating(null)} className="font-semibold text-accent-100 hover:underline">
                                        Clear
                                    </button>
                                </span>
                            )}
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            Sort by
                            <select
                                value={sort}
                                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-accent-100"
                            >
                                {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </label>
                    </div>

                    {list.isError ? (
                        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{getErrorMessage(list.error)}</p>
                    ) : list.isPending ? (
                        <Skeleton className="mt-4 h-40" />
                    ) : reviews.length === 0 ? (
                        <p className="mt-6 text-sm text-gray-600">
                            No {rating ? `${rating}-star ` : ""}reviews{withPhotos ? " with photos" : ""}.
                        </p>
                    ) : (
                        <ul className={`mt-2 divide-y divide-gray-200 ${list.isFetching ? "opacity-60" : ""}`}>
                            {reviews.map((r) => <ReviewItem key={r.id} review={r} />)}
                        </ul>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-40">Previous</button>
                            <span className="px-4 py-2 text-sm">Page {page} of {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:opacity-40">Next</button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}