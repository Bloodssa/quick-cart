import { useState } from "react";
import { Plus, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { PageHeader } from "../../components/admin/ui";
import { useProducts } from "../../queries/products";
import { useCancelQuickDrop, useCreateQuickDrop, useQuickDrops } from "../../queries/quickDrop";
import { getErrorMessage } from "../../api/client";

const ACCENT = "#ff5e1f";
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const when = (value) =>
    new Date(value).toLocaleString("en-PH", {
        timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });

const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// "now + minutes", rounded up to the next 5 minutes, as a datetime-local value
const roundedFromNow = (minutes) => {
    const d = new Date(Date.now() + minutes * 60_000);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
    return toLocalInput(d);
};

const STATUS_LABEL = { SoldOut: "Sold out" };
const STATUS_STYLE = {
    Live: "bg-[#ff5e1f] text-white",
    Scheduled: "bg-amber-100 text-amber-900",
    SoldOut: "bg-stone-800 text-white",
    Ended: "bg-stone-100 text-stone-600",
    Cancelled: "bg-stone-100 text-stone-500 line-through",
};
const FILTERS = [
    ["", "All"], ["Live", "Live"], ["Scheduled", "Scheduled"],
    ["SoldOut", "Sold out"], ["Ended", "Ended"], ["Cancelled", "Cancelled"],
];

const field = "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ff5e1f]";

function PriceLadder({ drop }) {
    const live = drop.status === "Live";

    // The server already knows the current step: it is the one right before `nextDropAt`,
    // or the last step when there is no next one. No clock needed in the component.
    const nextIndex = drop.nextDropAt
        ? drop.steps.findIndex((s) => new Date(s.startsAt).getTime() === new Date(drop.nextDropAt).getTime())
        : drop.steps.length;
    const current = live ? nextIndex - 1 : -1;

    return (
        <ol className="flex flex-wrap items-stretch gap-1.5">
            {drop.steps.map((s, i) => {
                const tone = !live
                    ? "border-stone-200 text-stone-600"
                    : i < current
                        ? "border-transparent bg-stone-100 text-stone-400 line-through"
                        : i === current
                            ? "border-transparent bg-[#ff5e1f] text-white"
                            : "border-stone-300 text-stone-700";
                return (
                    <li key={s.startsAt} className={`min-w-24 rounded-md border px-3 py-1.5 ${tone}`}>
                        <div className="text-sm font-semibold tabular-nums">{peso.format(s.price)}</div>
                        <div className="text-xs opacity-80">{when(s.startsAt)}</div>
                    </li>
                );
            })}
        </ol>
    );
}

function DropRow({ drop, onCancel, cancelling }) {
    const claimedPct = Math.min(100, Math.round((drop.sold / drop.quantity) * 100));
    const cancellable = drop.status === "Live" || drop.status === "Scheduled";

    return (
        <li className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{drop.productName}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[drop.status]}`}>
                        {STATUS_LABEL[drop.status] ?? drop.status}
                    </span>
                </div>
                {cancellable && (
                    <button
                        type="button"
                        disabled={cancelling}
                        onClick={() => window.confirm(`Cancel the Quick Drop for ${drop.productName}?`) && onCancel(drop.id)}
                        className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-[#ff5e1f]"
                    >
                        Cancel drop
                    </button>
                )}
            </div>

            <PriceLadder drop={drop} />

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-stone-600">
                <span>Regular price {peso.format(drop.regularPrice)}</span>
                <span>{when(drop.startsAt)} to {when(drop.endsAt)}</span>
                <span>Limit {drop.maxPerOrder} per order</span>
            </div>

            <div>
                <div className="mb-1 flex justify-between text-xs text-stone-600">
                    <span>{drop.sold} of {drop.quantity} claimed</span>
                    {drop.nextDropAt && (
                        <span>Next drop to {peso.format(drop.nextPrice)} at {when(drop.nextDropAt)}</span>
                    )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full bg-[#ff5e1f]" style={{ width: `${claimedPct}%` }} />
                </div>
            </div>
        </li>
    );
}

function NewDropForm({ onClose }) {
    const create = useCreateQuickDrop();
    const { data } = useProducts({ page: 1, pageSize: 100 });
    const products = Array.isArray(data) ? data : (data?.products ?? data?.items ?? data?.data ?? []);

    const [filter, setFilter] = useState("");
    const [productId, setProductId] = useState("");
    const [start, setStart] = useState(() => roundedFromNow(10));
    const [end, setEnd] = useState(() => roundedFromNow(190));
    const [quantity, setQuantity] = useState("10");
    const [maxPerOrder, setMaxPerOrder] = useState("2");
    const [prices, setPrices] = useState(["", "", ""]);

    const product = products.find((p) => String(p.id) === productId);
    const visible = products.filter((p) => p.name?.toLowerCase().includes(filter.toLowerCase()));

    const pickProduct = (id) => {
        setProductId(id);
        const p = products.find((x) => String(x.id) === id);
        if (!p) return;
        setPrices([0.9, 0.8, 0.7].map((f) => String(Math.round(p.price * f))));
        setQuantity(String(Math.max(1, Math.min(10, p.stock ?? 10))));
    };

    // Steps are spaced evenly across the window; the first one always starts with the drop.
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const stepTimes = prices.map((_, i) =>
        i === 0 ? startMs : Math.round((startMs + ((endMs - startMs) * i) / prices.length) / 60_000) * 60_000);

    const setPrice = (i, v) => setPrices((prev) => prev.map((p, idx) => (idx === i ? v : p)));

    const submit = (e) => {
        e.preventDefault();
        if (!(endMs > startMs)) {
            toast.error("The end time must be after the start time.");
            return;
        }
        create.mutate(
            {
                productId: Number(productId),
                startsAt: new Date(startMs).toISOString(),
                endsAt: new Date(endMs).toISOString(),
                quantity: Number(quantity),
                maxPerOrder: Number(maxPerOrder),
                steps: prices.map((p, i) => ({ startsAt: new Date(stepTimes[i]).toISOString(), price: Number(p) })),
            },
            { onSuccess: onClose },
        );
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-stone-900">New Quick Drop</h2>
                <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 hover:bg-stone-100">
                    <X size={18} />
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                    Find a product
                    <input className={field} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Type to filter" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Product
                    <select required className={field} value={productId} onChange={(e) => pickProduct(e.target.value)}>
                        <option value="">Choose a product</option>
                        {visible.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({peso.format(p.price)})</option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Starts
                    <input required type="datetime-local" className={field} value={start} onChange={(e) => setStart(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Ends
                    <input required type="datetime-local" className={field} value={end} onChange={(e) => setEnd(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Units at drop prices
                    <input required type="number" min="1" max={product?.stock} className={field} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    {product && <span className="text-xs text-stone-500">{product.stock} in stock</span>}
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Limit per order
                    <input required type="number" min="1" className={field} value={maxPerOrder} onChange={(e) => setMaxPerOrder(e.target.value)} />
                </label>
            </div>

            <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-stone-900">Price ladder</legend>
                <p className="text-xs text-stone-500">
                    The price falls at each step and stays at the last one until the drop ends or the units run out.
                </p>
                {prices.map((p, i) => {
                    const off = product && Number(p) > 0 ? Math.round((1 - Number(p) / product.price) * 100) : null;
                    return (
                        <div key={i} className="flex items-center gap-3">
                            <span className="w-32 text-sm text-stone-600">{when(stepTimes[i])}</span>
                            <input
                                required type="number" min="1" step="0.01" aria-label={`Price for step ${i + 1}`}
                                className={`${field} max-w-40`} value={p} onChange={(e) => setPrice(i, e.target.value)}
                            />
                            <span className="w-16 text-sm text-stone-500">{off !== null && `${off}% off`}</span>
                            {prices.length > 2 && (
                                <button
                                    type="button" aria-label={`Remove step ${i + 1}`}
                                    onClick={() => setPrices((prev) => prev.filter((_, idx) => idx !== i))}
                                    className="rounded-md p-1 hover:bg-stone-100"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
                {prices.length < 4 && (
                    <button
                        type="button"
                        onClick={() => setPrices((prev) => [...prev, ""])}
                        className="self-start rounded-md px-2 py-1 text-sm text-stone-700 hover:bg-stone-100"
                    >
                        Add a step
                    </button>
                )}
            </fieldset>

            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm hover:bg-stone-100">Cancel</button>
                <button
                    type="submit" disabled={create.isPending}
                    className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}
                >
                    {create.isPending ? "Creating" : "Create Quick Drop"}
                </button>
            </div>
        </form>
    );
}

export default function Deals() {
    useDocumentTitle("Deals & Promotions");

    const [creating, setCreating] = useState(false);
    const [status, setStatus] = useState("");
    const { data: drops = [], isLoading, isError, error } = useQuickDrops(status || undefined);
    const cancel = useCancelQuickDrop();

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Deals & Promotions"
                subtitle="Quick Drops lower a product's price on a schedule while a limited pool of units lasts."
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1">
                    {FILTERS.map(([value, label]) => (
                        <button
                            key={value} type="button" aria-pressed={status === value}
                            onClick={() => setStatus(value)}
                            className={`rounded-full px-3 py-1 text-sm ${status === value ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {!creating && (
                    <button
                        onClick={() => setCreating(true)}
                        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white"
                        style={{ backgroundColor: ACCENT }}
                    >
                        <Plus size={16} /> New Quick Drop
                    </button>
                )}
            </div>

            {creating && <NewDropForm onClose={() => setCreating(false)} />}

            {isError ? (
                <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
            ) : isLoading ? (
                <p className="text-sm text-stone-500">Loading Quick Drops</p>
            ) : drops.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-stone-300 py-12 text-center">
                    <Zap size={24} style={{ color: ACCENT }} />
                    <p className="font-medium text-stone-900">No Quick Drops here yet</p>
                    <p className="max-w-sm text-sm text-stone-600">
                        Pick a product, set a price ladder, and the price falls on schedule while the units last.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
                    {drops.map((d) => (
                        <DropRow key={d.id} drop={d} onCancel={cancel.mutate} cancelling={cancel.isPending} />
                    ))}
                </ul>
            )}
        </div>
    );
}