import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useDebouncedValue } from "../../hooks/useDebounce";
import { EmptyState, ErrorState, PageHeader, Pagination, inputCls } from "../../components/admin/ui";
import ReviewCard from "../../components/reviews/ReviewCard";
import { useAdminReviews } from "../../queries/adminReviews";

const PAGE_SIZE = 10;
const TABS = [
    ["needsReply", "Needs reply", "needsReply"],
    ["all", "All", "all"],
    ["low", "Low ratings (1-2 stars)", "low"],
];
const EMPTY = {
    needsReply: "You've answered every review.",
    low: "No low-rated reviews.",
    all: "No reviews yet.",
};

export default function Reviews() {
    useDocumentTitle("Reviews");

    // the filter lives in the URL so the dashboard can link straight to "Needs reply"
    const [params, setParams] = useSearchParams();
    const requested = params.get("filter");
    const filter = TABS.some(([value]) => value === requested) ? requested : "all";

    const [withPhotos, setWithPhotos] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const search = useDebouncedValue(searchInput.trim(), 400); // the request only uses this value

    const [pageState, setPageState] = useState({ search: "", page: 1 });
    const page = pageState.search === search ? pageState.page : 1;
    const setPage = (p) => setPageState({ search, page: p });

    const { data, isPending, isFetching, isError, refetch } = useAdminReviews({
        filter,
        withPhotos: withPhotos || undefined,
        search: search || undefined,
        page,
        pageSize: PAGE_SIZE,
    });

    const reviews = data?.reviews ?? [];
    const counts = data?.counts;
    const totalPages = Math.max(1, Math.ceil((data?.totalResults ?? 0) / PAGE_SIZE));

    function selectTab(value) {
        setParams({ filter: value });
        setPage(1);
    }

    return (
        <div className="flex flex-col gap-5">
            <PageHeader title="Reviews" subtitle="What customers say about your products. Reply once per review; you can edit it later." />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Filter reviews" className="flex flex-wrap gap-2">
                    {TABS.map(([value, label, countKey]) => {
                        const active = filter === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => selectTab(value)}
                                className={`h-9 rounded-full border px-4 text-xs font-semibold ${active ? "border-accent-100 bg-accent-50 text-accent-300" : "border-gray-300 hover:bg-gray-50"}`}
                            >
                                {label}{counts ? ` (${counts[countKey]})` : ""}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={withPhotos}
                            onChange={(e) => { setWithPhotos(e.target.checked); setPage(1); }}
                            className="size-4 accent-accent-100"
                        />
                        With photos
                    </label>
                    <div className="w-full sm:w-80">
                        <label htmlFor="review-search" className="sr-only">Search by product or customer</label>
                        <input
                            id="review-search"
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search product or customer"
                            className={`${inputCls} w-70`}
                        />
                    </div>
                </div>
            </div>

            {isError ? (
                <ErrorState onRetry={refetch} />
            ) : isPending ? (
                <div className="h-48 animate-pulse rounded-md bg-gray-100" />
            ) : reviews.length === 0 ? (
                <EmptyState title={search ? "No reviews match your search" : EMPTY[filter]} />
            ) : (
                <ul className={`flex flex-col gap-4 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
                    {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </ul>
            )}

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
    );
}