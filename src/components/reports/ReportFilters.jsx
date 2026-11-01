import { Card, inputCls } from "../admin/ui";
import { rangeFor } from "../../lib/dates";

const PRESETS = [
    { label: "Today", days: 0 },
    { label: "7 days", days: 6 },
    { label: "30 days", days: 29 },
    { label: "90 days", days: 89 },
];

export default function ReportFilters({ range, onChange, error }) {
    return (
        <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((p) => (
                    <button key={p.label} type="button" onClick={() => onChange(rangeFor(p.days))}
                        className="h-9 rounded-full border border-gray-300 px-4 text-xs font-semibold hover:bg-gray-50">
                        {p.label}
                    </button>
                ))}
                <span className="flex-1" />
                <label htmlFor="r-from" className="text-sm font-semibold">From</label>
                <input id="r-from" type="date" value={range.from} max={range.to}
                    onChange={(e) => onChange({ ...range, from: e.target.value })} className={`${inputCls} w-auto`} />
                <label htmlFor="r-to" className="text-sm font-semibold">To</label>
                <input id="r-to" type="date" value={range.to} min={range.from}
                    onChange={(e) => onChange({ ...range, to: e.target.value })} className={`${inputCls} w-auto`} />
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        </Card>
    );
}