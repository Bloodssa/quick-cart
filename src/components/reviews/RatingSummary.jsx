import StarRating from "./StarRating";

export default function RatingSummary({ summary, selected, onSelect }) {
    const { average, total, distribution } = summary;

    return (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="flex flex-col items-center gap-1 sm:w-40">
                <p className="text-5xl font-bold text-heading">{average.toFixed(1)}</p>
                <StarRating value={average} size={20} />
                <p className="text-sm text-gray-500">{total} {total === 1 ? "review" : "reviews"}</p>
            </div>

            <ul className="min-w-0 flex-1 space-y-1">
                {distribution.map(({ stars, count }) => {
                    const active = selected === stars;
                    const pct = total ? (count / total) * 100 : 0;
                    return (
                        <li key={stars}>
                            <button
                                type="button"
                                aria-pressed={active}
                                disabled={count === 0 && !active}
                                onClick={() => onSelect(active ? null : stars)}
                                className={`flex w-full items-center gap-3 rounded-md px-2 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-accent-100 ${active ? "bg-accent-50" : ""}`}
                            >
                                <span className="w-12 text-left text-gray-600">{stars} star</span>
                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                    <span className="block h-full bg-accent-100" style={{ width: `${pct}%` }} />
                                </span>
                                <span className="w-10 text-right tabular-nums text-gray-500">{count}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}