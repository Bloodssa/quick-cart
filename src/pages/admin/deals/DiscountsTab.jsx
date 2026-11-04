import { useEffect, useRef, useState } from "react";
import { Ban, CalendarClock, ChevronDown, Plus, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "../../../queries/products";
import { useCreateDeal, useDeals, useEndDeal } from "../../../queries/deals";
import { getErrorMessage } from "../../../api/client";
import { ConfirmModal, FormModal, useModal } from "../../../components/ui/AppModal";
import {
    card, dealPrice, discountLabel, field, FilterBar, focusRing,
    ghostButton, peso, primaryButton, roundedFromNow, StatusBadge, when,
} from "./shared";
import { EmptyState } from "../../../components/admin/ui";

const FILTERS = [
    ["", "All"], ["Active", "Active"], ["Scheduled", "Scheduled"], ["Ended", "Ended"], ["Cancelled", "Cancelled"],
];

function ProductLine({ product }) {
    return (
        <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="min-w-0 truncate text-neutral-900">{product.name}</span>
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                <s className="text-xs text-neutral-500">{peso.format(product.regularPrice)}</s>
                <span className="font-semibold text-neutral-900">{peso.format(product.dealPrice)}</span>
            </span>
        </li>
    );
}

function DealRow({ deal, onEnd, ending }) {
    const endModal = useModal();

    const isActive = deal.status === "Active";
    const endable = isActive || deal.status === "Scheduled";
    const shown = deal.products.slice(0, 3);
    const rest = deal.products.slice(3);
    const count = deal.products.length;

    const confirmEnd = () =>
        onEnd(deal.id, {
            onSuccess: () => {
                endModal.close();
                toast.success(isActive ? "Discount ended" : "Discount cancelled");
            },
            onError: (err) => {
                endModal.close();
                toast.error(getErrorMessage(err));
            },
        });

    return (
        <li className="flex flex-col gap-4 p-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">{deal.name}</h3>
                        <StatusBadge status={deal.status} />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-500">
                        <CalendarClock size={14} aria-hidden="true" className="shrink-0" />
                        {when(deal.startsAt)} to {when(deal.endsAt)}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="rounded-md border border-accent-100 bg-accent-50 px-2.5 py-1 text-sm font-bold text-neutral-900">
                        {discountLabel(deal.discountType, deal.value)}
                    </span>
                    {endable && (
                        <button
                            type="button"
                            disabled={ending}
                            onClick={endModal.open}
                            className={`${ghostButton} py-1`}
                        >
                            {isActive ? "End now" : "Cancel"}
                        </button>
                    )}
                </div>
            </div>

            {/* Products */}
            <div className="rounded-md border border-gray-200 bg-gray-50">
                <p className="border-b border-gray-200 px-3 py-2 text-xs font-medium text-neutral-500">
                    {count} {count === 1 ? "product" : "products"}
                </p>

                <ul className="divide-y divide-gray-200">
                    {shown.map((p) => <ProductLine key={p.productId} product={p} />)}
                </ul>

                {rest.length > 0 && (
                    <details className="group border-t border-gray-200 text-sm">
                        <summary
                            className={`flex cursor-pointer list-none items-center justify-center gap-1.5 px-3 py-2 font-medium text-neutral-600 hover:text-neutral-900 [&::-webkit-details-marker]:hidden ${focusRing}`}
                        >
                            <span className="group-open:hidden">
                                Show {rest.length} more {rest.length === 1 ? "product" : "products"}
                            </span>
                            <span className="hidden group-open:inline">Show less</span>
                            <ChevronDown
                                size={14}
                                aria-hidden="true"
                                className="transition-transform group-open:rotate-180"
                            />
                        </summary>
                        <ul className="divide-y divide-gray-200 border-t border-gray-200">
                            {rest.map((p) => <ProductLine key={p.productId} product={p} />)}
                        </ul>
                    </details>
                )}
            </div>

            {/* End / cancel discount */}
            <ConfirmModal
                isOpen={endModal.isOpen}
                onClose={endModal.close}
                onConfirm={confirmEnd}
                destructive
                icon={Ban}
                title={isActive ? "End this discount now?" : "Cancel this discount?"}
                message={
                    isActive ? (
                        <>
                            <span className="font-semibold text-heading">{deal.name}</span> will stop right away
                            and products go back to their regular price.
                        </>
                    ) : (
                        <>
                            <span className="font-semibold text-heading">{deal.name}</span> is scheduled but
                            hasn't started yet. It will never run.
                        </>
                    )
                }
                confirmLabel={isActive ? "End discount" : "Cancel discount"}
                pendingLabel={isActive ? "Ending…" : "Cancelling…"}
                cancelLabel="Keep it"
                isPending={ending}
            />
        </li>
    );
}

function NewDealModal({ onClose }) {
    const create = useCreateDeal();

    const [name, setName] = useState("");
    const [type, setType] = useState("Percent");
    const [value, setValue] = useState("");
    const [start, setStart] = useState(() => roundedFromNow(10));
    const [end, setEnd] = useState(() => roundedFromNow(60 * 24 * 7));
    const [selected, setSelected] = useState([]);
    const [formError, setFormError] = useState("");

    // keep the error in view when the form is scrolled down
    const errorRef = useRef(null);
    useEffect(() => {
        if (formError) errorRef.current?.scrollIntoView({ block: "nearest" });
    }, [formError]);

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
        setFormError("");

        // the form has noValidate, so run the browser checks (required, min, max) ourselves
        if (!e.currentTarget.reportValidity()) return;

        if (selected.length === 0) {
            setFormError("Choose at least one product.");
            return;
        }
        const startsAt = new Date(start);
        const endsAt = new Date(end);
        if (!(endsAt > startsAt)) {
            setFormError("The end time must be after the start time.");
            return;
        }
        if (type === "Amount" && selected.some((p) => amount >= p.price)) {
            setFormError("The amount off must be less than the price of every selected product.");
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
            {
                onSuccess: onClose, // only a successful save closes the modal
                onError: (err) => setFormError(getErrorMessage(err)),
            },
        );
    };

    return (
        <FormModal
            isOpen
            onClose={onClose}
            onSubmit={submit}
            icon={Tag}
            title="New discount"
            description="Pick products, set the discount and choose when it runs."
            submitLabel="Create discount"
            pendingLabel="Creating…"
            isPending={create.isPending}
        >
            <div className="flex flex-col gap-4">
                {formError && (
                    <p ref={errorRef} role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                        {formError}
                    </p>
                )}

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
            </div>
        </FormModal>
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
                <button type="button" onClick={() => setCreating(true)} className={`${primaryButton} flex items-center gap-1.5`}>
                    <Plus size={16} /> New discount
                </button>
            </div>

            {creating && <NewDealModal onClose={() => setCreating(false)} />}

            {isError ? (
                <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
            ) : isLoading ? (
                <p className="text-sm text-neutral-500">Loading discounts</p>
            ) : deals.length === 0 ? (
                <EmptyState
                    bordered
                    icon={Tag}
                    title="No discounts here yet"
                    message="Pick products, set a percent or peso amount off, and choose when it runs."
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