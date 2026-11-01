import { useState } from "react";
import { Copy, Plus, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateVoucher, useSetVoucherActive, useVouchers } from "../../../queries/vouchers";
import { getErrorMessage } from "../../../api/client";
import {
    card, EmptyState, field, FilterBar, focusRing, ghostButton, peso,
    primaryButton, roundedFromNow, StatusBadge, when,
} from "./shared";

const FILTERS = [
    ["", "All"], ["Active", "Active"], ["Scheduled", "Scheduled"],
    ["Expired", "Expired"], ["UsedUp", "Fully claimed"], ["Disabled", "Disabled"],
];

function VoucherCard({ voucher: v, onToggle, toggling }) {
    const usedPct = v.usageLimit ? Math.min(100, Math.round((v.usedCount / v.usageLimit) * 100)) : 0;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(v.code);
            toast.success("Code copied");
        } catch {
            toast.error("Couldn't copy the code.");
        }
    };

    const terms = [
        v.minSpend > 0 ? `Min. spend ${peso.format(v.minSpend)}` : "No minimum spend",
        v.maxDiscount ? `Up to ${peso.format(v.maxDiscount)} off` : null,
        `${v.perUserLimit} ${v.perUserLimit === 1 ? "use" : "uses"} per customer`,
    ].filter(Boolean);

    return (
        <li className={`${card} flex overflow-hidden`}>
            <div className="flex w-32 shrink-0 flex-col items-center justify-center border-r border-dashed border-gray-300 bg-accent-50 p-3 text-center">
                <span className="text-xl font-bold text-neutral-900">
                    {v.discountType === "Percent" ? `${v.value}%` : peso.format(v.value)}
                </span>
                <span className="text-xs font-medium text-neutral-900">OFF</span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-sm font-semibold text-neutral-900">
                            {v.code}
                        </span>
                        <button
                            type="button" onClick={copy} aria-label={`Copy code ${v.code}`}
                            className={`rounded-md p-1 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 ${focusRing}`}
                        >
                            <Copy size={14} />
                        </button>
                        <StatusBadge status={v.status} />
                    </div>
                    <button
                        type="button" disabled={toggling}
                        onClick={() => onToggle({ id: v.id, isActive: !v.isActive })}
                        className={`${ghostButton} py-1`}
                    >
                        {v.isActive ? "Disable" : "Enable"}
                    </button>
                </div>

                <p className="text-sm font-medium text-neutral-900">{v.title}</p>

                <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-neutral-500">
                    {terms.map((t) => <li key={t}>{t}</li>)}
                </ul>

                <p className="text-sm text-neutral-500">{when(v.startsAt)} to {when(v.endsAt)}</p>

                <div>
                    <p className="mb-1 text-xs text-neutral-500">
                        {v.usageLimit ? `${v.usedCount} of ${v.usageLimit} used` : `${v.usedCount} used, no limit`}
                    </p>
                    {v.usageLimit && (
                        <div className="h-1.5 overflow-hidden rounded-md bg-gray-100">
                            <div className="h-full bg-accent-100" style={{ width: `${usedPct}%` }} />
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}

function NewVoucherForm({ onClose }) {
    const create = useCreateVoucher();

    const [code, setCode] = useState("");
    const [title, setTitle] = useState("");
    const [type, setType] = useState("Percent");
    const [value, setValue] = useState("");
    const [minSpend, setMinSpend] = useState("0");
    const [maxDiscount, setMaxDiscount] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [perUserLimit, setPerUserLimit] = useState("1");
    const [start, setStart] = useState(() => roundedFromNow(10));
    const [end, setEnd] = useState(() => roundedFromNow(60 * 24 * 30));

    const submit = (e) => {
        e.preventDefault();
        const startsAt = new Date(start);
        const endsAt = new Date(end);
        if (!(endsAt > startsAt)) {
            toast.error("The end time must be after the start time.");
            return;
        }
        create.mutate(
            {
                code,
                title: title.trim(),
                discountType: type,
                value: Number(value),
                minSpend: Number(minSpend || 0),
                maxDiscount: type === "Percent" && maxDiscount !== "" ? Number(maxDiscount) : null,
                usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
                perUserLimit: Number(perUserLimit),
                startsAt: startsAt.toISOString(),
                endsAt: endsAt.toISOString(),
            },
            { onSuccess: onClose },
        );
    };

    return (
        <form onSubmit={submit} className={`${card} flex flex-col gap-4 p-4`}>
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">New voucher</h2>
                <button
                    type="button" onClick={onClose} aria-label="Close"
                    className={`rounded-md p-1 text-neutral-500 hover:bg-gray-100 ${focusRing}`}
                >
                    <X size={18} />
                </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    Code
                    <input
                        required minLength={4} maxLength={20} className={`${field} font-mono`} value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        placeholder="WELCOME100"
                    />
                    <span className="text-xs text-neutral-500">4 to 20 letters or numbers</span>
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    Title
                    <input
                        required maxLength={80} className={field} value={title}
                        onChange={(e) => setTitle(e.target.value)} placeholder="Welcome voucher"
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
                    Minimum spend
                    <input type="number" min="0" step="0.01" className={field} value={minSpend} onChange={(e) => setMinSpend(e.target.value)} />
                </label>
                {type === "Percent" && (
                    <label className="flex flex-col gap-1 text-sm text-neutral-900">
                        Max discount
                        <input
                            type="number" min="1" step="0.01" className={field} value={maxDiscount}
                            onChange={(e) => setMaxDiscount(e.target.value)} placeholder="No cap"
                        />
                    </label>
                )}

                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    Total uses
                    <input
                        type="number" min="1" className={field} value={usageLimit}
                        onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm text-neutral-900">
                    Uses per customer
                    <input required type="number" min="1" className={field} value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} />
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

            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className={ghostButton}>Cancel</button>
                <button type="submit" disabled={create.isPending} className={primaryButton}>
                    {create.isPending ? "Creating" : "Create voucher"}
                </button>
            </div>
        </form>
    );
}

export default function VouchersTab() {
    const [creating, setCreating] = useState(false);
    const [status, setStatus] = useState("");
    const { data: vouchers = [], isLoading, isError, error } = useVouchers(status || undefined);
    const toggle = useSetVoucherActive();

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <FilterBar label="Filter vouchers by status" options={FILTERS} value={status} onChange={setStatus} />
                {!creating && (
                    <button type="button" onClick={() => setCreating(true)} className={`${primaryButton} flex items-center gap-1.5`}>
                        <Plus size={16} /> New voucher
                    </button>
                )}
            </div>

            {creating && <NewVoucherForm onClose={() => setCreating(false)} />}

            {isError ? (
                <p className="text-sm text-red-700">{getErrorMessage(error)}</p>
            ) : isLoading ? (
                <p className="text-sm text-neutral-500">Loading vouchers</p>
            ) : vouchers.length === 0 ? (
                <EmptyState
                    icon={Ticket} title="No vouchers here yet"
                    text="Create a code with a minimum spend and a usage limit, then share it with shoppers."
                />
            ) : (
                <ul className="flex flex-col gap-3">
                    {vouchers.map((v) => (
                        <VoucherCard key={v.id} voucher={v} onToggle={toggle.mutate} toggling={toggle.isPending} />
                    ))}
                </ul>
            )}
        </div>
    );
}