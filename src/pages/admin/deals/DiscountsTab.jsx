import { useEffect, useState } from "react";
import { Plus, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "../../../queries/products";
import { useCreateDeal, useDeals, useEndDeal } from "../../../queries/deals";
import { getErrorMessage } from "../../../api/client";
import {
    card, dealPrice, discountLabel, EmptyState, field, FilterBar, focusRing,
    ghostButton, peso, primaryButton, roundedFromNow, StatusBadge, when,
} from "./shared";

const FILTERS = [
    ["", "All"], ["Active", "Active"], ["Scheduled", "Scheduled"], ["Ended", "Ended"], ["Cancelled", "Cancelled"],
];

function ProductLine({ product }) {
    return (
        <li className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-neutral-900">{product.name}</span>
            <span className="shrink-0 tabular-nums">
                <s className="mr-2 text-neutral-500">{peso.format(product.regularPrice)}</s>
                <span className="font-semibold text-neutral-900">{peso.format(product.dealPrice)}</span>
            </span>
        </li>
    );
}

function DealRow({ deal, onEnd, ending }) {
    const endable = deal.status === "Active" || deal.status === "Scheduled";
    const shown = deal.products.slice(0, 3);
    const rest = deal.products.slice(3);

    return (
        <li className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-neutral-900">{deal.name}</h3>
                    <StatusBadge status={deal.status} />
                    <span className="rounded-md border border-accent-100 bg-accent-50 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                        {discountLabel(deal.discountType, deal.value)}
                    </span>
                </div>
                {endable && (
                    <button
                        type="button" disabled={ending}
                        onClick={() => window.confirm(`${deal.status === "Active" ? "End" : "Cancel"} "${deal.name}"?`) && onEnd(deal.id)}
                        className={`${ghostButton} py-1`}
                    >
                        {deal.status === "Active" ? "End now" : "Cancel"}
                    </button>
                )}
            </div>

            <p className="text-sm text-neutral-500">{when(deal.startsAt)} to {when(deal.endsAt)}</p>

            <ul className="flex flex-col gap-1.5">
                {shown.map((p) => <ProductLine key={p.productId} product={p} />)}
            </ul>

            {rest.length > 0 && (
                <details className="text-sm">
                    <summary className={`cursor-pointer text-neutral-500 hover:text-neutral-900 ${focusRing}`}>
                        Show {rest.length} more {rest.length === 1 ? "product" : "products"}
                    </summary>
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                        {rest.map((p) => <ProductLine key={p.productId} product={p} />)}
                    </ul>
                </details>
            )}
        </li>
    );
}

function NewDealForm({ onClose }) {
    const create = useCreateDeal();

    const [name, setName] = useState("");
    const [type, setType] = useState("Percent");
    const [value, setValue] = useState("");
    const [start, setStart] = useState(() => roundedFromNow(10));
    const [end, setEnd] = useState(() => roundedFromNow(60 * 24 * 7));
    const [selected, setSelected] = useState([]);

    // what the admin types, and a delayed copy that is sent to the API
    const [filter, setFilter] = useState("");
    const [search, setSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setSearch(filter.trim()), 300);
        return () => clearTimeout(id);
    }, [filter]);

    const { data } = useProducts({ page: 1, pageSize: 20, search });
    const found = Array.isArray(data) ? data : (data?.products ?? data?.items ?? data?.data ?? []);

    const amount = Number(value);
    const isSelected = (p) => selected.some((s) => s.id === p.id);
    const toggle = (p) =>
        setSelected((prev) => (prev.some((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]));

    const submit = (e) => {
        e.preventDefault();
        if (selected.length === 0) {
            toast.error("Choose at least one product.");
            return;
        }
        const startsAt = new Date(start);
        const endsAt = new Date(end);
        if (!(endsAt > startsAt)) {
            toast.error("The end time must be after the start time.");
            return;
        }
        create.mutate(
            {
                name: name.trim(),
                discountType: type,
                value: amount,
                startsAt: startsAt.toISOString(),
                endsAt: endsAt.toISOString(),
                productIds: selected.map((p) => p.id),
            },
            { onSuccess: onClose },
        );
    };

    return (
        <form onSubmit={submit} className={`${card} flex flex-col gap-4 p-4`}>
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">New discount</h2>
                <button
                    type="button" onClick={onClose} aria-label="Close"
                    className={`rounded-md p-1 text-neutral-500 hover:bg-gray-100 ${focusRing}`}
                >
                    <X size={18} />
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-neutral-900 md:col-span-2">
                    Name
                    <input
                        required maxLength={80} className={field} value={name}
                        onChange={(e) => setName(e.target.value)} placeholder="Weekend savings"
                    />
                </label>

                <div className="flex flex-col gap-1 text-sm text-neutral-900">
                    Discount type
                    <div role="group" aria-label="Discount type" className="flex gap-1">
                        {[["Percent", "Percentage"], ["Amount", "Amount off"]].map(([id, label]) => (
                            <button
                                key={id} type="button" aria-pressed={type === id} onClick={() => setType(id)}
                                className={`flex-1 rounded-md border px-3 py-2 text-sm ${focusRing} ${type === id
                                    ? "border-accent-100 bg-accent-50 font-medium text-neutral-900"
                                    : "border-gray-300 bg-white text-neutral-500 hover:text-neutral-900"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    {type === "Percent" ? "Percent off (1 to 90)" : "Peso amount off"}
                    <input
                        required type="number" step={type === "Percent" ? "1" : "0.01"}
                        min={type === "Percent" ? "1" : "0.01"} max={type === "Percent" ? "90" : undefined}
                        className={field} value={value} onChange={(e) => setValue(e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    Starts
                    <input required type="datetime-local" className={field} value={start} onChange={(e) => setStart(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    Ends
                    <input required type="datetime-local" className={field} value={end} onChange={(e) => setEnd(e.target.value)} />
                </label>
            </div>

            <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    Products
                    <input
                        className={field} value={filter} onChange={(e) => setFilter(e.target.value)}
                        placeholder="Search by product name"
                    />
                </label>

                <ul className="max-h-56 divide-y divide-gray-300 overflow-auto rounded-md border border-gray-300">
                    {found.length === 0 && <li className="p-3 text-sm text-neutral-500">No products found</li>}
                    {found.map((p) => (
                        <li key={p.id}>
                            <label className="flex cursor-pointer items-center gap-3 p-2 text-sm hover:bg-gray-50">
                                <input
                                    type="checkbox" className="accent-accent-100"
                                    checked={isSelected(p)} onChange={() => toggle(p)}
                                />
                                <span className="flex-1 truncate text-neutral-900">{p.name}</span>
                                <span className="tabular-nums text-neutral-500">{peso.format(p.price)}</span>
                            </label>
                        </li>
                    ))}
                </ul>
            </div>

            {selected.length > 0 && (
                <div className="rounded-md border border-gray-300 bg-accent-50 p-3">
                    <p className="mb-2 text-sm font-medium text-neutral-900">
                        {selected.length} {selected.length === 1 ? "product" : "products"} selected
                    </p>
                    <ul className="flex flex-col gap-1.5">
                        {selected.map((p) => {
                            const invalid = type === "Amount" && amount >= p.price;
                            return (
                                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="truncate text-neutral-900">{p.name}</span>
                                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                                        {invalid ? (
                                            <span className="text-red-700">Must be less than the price</span>
                                        ) : (
                                            <>
                                                <s className="text-neutral-500">{peso.format(p.price)}</s>
                                                <span className="font-semibold text-neutral-900">
                                                    {amount > 0 ? peso.format(dealPrice(type, amount, p.price)) : "..."}
                                                </span>
                                            </>
                                        )}
                                        <button
                                            type="button" aria-label={`Remove ${p.name}`} onClick={() => toggle(p)}
                                            className={`rounded-md p-0.5 text-neutral-500 hover:bg-white ${focusRing}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className={ghostButton}>Cancel</button>
                <button type="submit" disabled={create.isPending} className={primaryButton}>
                    {create.isPending ? "Creating" : "Create discount"}
                </button>
            </div>
        </form>
    );
}

export default function DiscountsTab() {
    const [creating, setCreating] = useState(false);
    const [status, setStatus] = useState("");
    const { data: deals = [], isLoading, isError, error } = useDeals(status || undefined);
    const end = useEndDeal();

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <FilterBar label="Filter discounts by status" options={FILTERS} value={status} onChange={setStatus} />
                {!creating && (
                    <button type="button" onClick={() => setCreating(true)} className={`${primaryButton} flex items-center gap-1.5`}>
                        <Plus size={16} /> New discount
                    </button>
                )}
            </div>

            {creating && <NewDealForm onClose={() => setCreating(false)} />}

            {isError ? (
                <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
            ) : isLoading ? (
                <p className="text-sm text-neutral-500">Loading discounts</p>
            ) : deals.length === 0 ? (
                <EmptyState
                    icon={Tag} title="No discounts here yet"
                    text="Pick products, set a percent or peso amount off, and choose when it runs."
                />
            ) : (
                <ul className={`${card} divide-y divide-gray-300`}>
                    {deals.map((d) => (
                        <DealRow key={d.id} deal={d} onEnd={end.mutate} ending={end.isPending} />
                    ))}
                </ul>
            )}
        </div>
    );
}