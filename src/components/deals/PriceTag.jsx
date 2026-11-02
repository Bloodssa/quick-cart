import { formatPrice } from "../../lib/format";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Clock } from "lucide-react";

const listeners = new Set();
let timer = null;

function subscribe(callback) {
    listeners.add(callback);
    timer ??= setInterval(() => listeners.forEach((l) => l()), 1000);

    return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
            clearInterval(timer);
            timer = null;
        }
    };
}

const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000; // current second

const pad = (n) => String(n).padStart(2, "0");

function split(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    return {
        d: Math.floor(total / 86400),
        h: Math.floor((total % 86400) / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60,
    };
}

export function PriceTag({ product, className = "" }) {
    if (product.dealPrice == null) {
        return <span className={`font-bold text-heading ${className}`}>{formatPrice(product.price)}</span>;
    }

    return (
        <span className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
            <span className="font-bold text-accent-100">{formatPrice(product.dealPrice)}</span>
            <s className="text-sm text-neutral-500">{formatPrice(product.price)}</s>
        </span>
    );
}

// put the image in a "relative" wrapper
export function DealBadge({ product }) {
    if (product.dealPrice == null) return null;

    const saved = product.price - product.dealPrice;
    const label = product.discountPercent >= 1 ? `-${product.discountPercent}%` : `-${formatPrice(saved)}`;

    return (
        <span className="absolute left-2 top-2 rounded-md bg-accent-100 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
            {label}
        </span>
    );
}

function FlipTile({ value, wrap, tone, big }) {
    const [initial] = useState(value);    // no animation on the first render
    const animate = value !== initial;
    // it is a countdown, so the number before this one is value + 1
    const prev = wrap ? (value + 1) % wrap : value + 1;

    const text = pad(value);
    const prevText = pad(prev);

    const size = big ? "h-14 w-12 text-2xl" : "h-7 w-6 text-xs";
    const face = "absolute inset-x-0 flex h-[200%] items-center justify-center font-bold tabular-nums text-white";
    const half = `absolute inset-x-0 h-1/2 overflow-hidden ${tone}`;

    return (
        <span aria-hidden="true" className={`relative block perspective-near ${size}`}>
            {/* resting halves: top shows the new number, bottom the old one until the flap covers it */}
            <span className={`${half} top-0 rounded-t`}>
                <span className={`${face} top-0`}>{text}</span>
            </span>
            <span className={`${half} bottom-0 rounded-b brightness-90`}>
                <span className={`${face} bottom-0`}>{animate ? prevText : text}</span>
            </span>

            {animate && (
                <>
                    {/* old number folding down */}
                    <span key={`t${value}`} className={`${half} top-0 z-20 origin-bottom rounded-t animate-flip-top motion-reduce:hidden`}>
                        <span className={`${face} top-0`}>{prevText}</span>
                    </span>
                    {/* new number dropping in */}
                    <span key={`b${value}`} className={`${half} bottom-0 z-20 origin-top rounded-b brightness-90 animate-flip-bottom motion-reduce:animate-none`}>
                        <span className={`${face} bottom-0`}>{text}</span>
                    </span>
                </>
            )}

            {/* the hinge line */}
            <span className="absolute inset-x-0 top-1/2 z-30 h-px -translate-y-1/2 bg-black/25" />
        </span>
    );
}

export function DealEnds({ product, variant = "card", onExpire }) {
    const now = useSyncExternalStore(subscribe, getSnapshot);

    const end = product.dealEndsAt ? new Date(product.dealEndsAt).getTime() : null;
    const remaining = end === null ? null : end - now;
    const expired = remaining !== null && remaining <= 0;

    useEffect(() => {
        if (expired) onExpire?.();
    }, [expired, onExpire]);

    if (remaining === null || expired) return null;

    const { d, h, m, s } = split(remaining);
    const urgent = remaining < 60 * 60 * 1000; // under 1 hour: tiles turn red

    // more than a day left: days / hours / minutes. Otherwise: hours / minutes / seconds.
    const units = d >= 1
        ? [{ v: d, wrap: null, label: "Days" }, { v: h, wrap: 24, label: "Hrs" }, { v: m, wrap: 60, label: "Mins" }]
        : [{ v: h, wrap: 24, label: "Hrs" }, { v: m, wrap: 60, label: "Mins" }, { v: s, wrap: 60, label: "Secs" }];

    const tone = urgent ? "bg-red-600" : "bg-accent-100";
    const big = variant === "banner";

    const spoken = d >= 1 ? `${d} days ${h} hours ${m} minutes` : `${h} hours ${m} minutes ${s} seconds`;

    return (
        <div
            role="timer"
            className={big
                ? `flex items-center gap-4 rounded-md border px-4 py-3 ${urgent ? "border-red-200 bg-red-50" : "border-accent-100/30 bg-accent-50"}`
                : "mt-1.5 flex items-center gap-1.5"}
        >
            <span className={`flex items-center gap-1 font-semibold ${big ? "text-sm" : "text-xs"} ${urgent ? "text-red-600" : "text-accent-100"}`}>
                <Clock size={big ? 18 : 12} aria-hidden="true" className={urgent ? "animate-pulse" : ""} />
                {urgent ? "Ending soon" : "Ends in"}
            </span>

            <span className="sr-only">{spoken} left</span>

            <span className={`flex items-start ${big ? "gap-2" : "gap-1"}`}>
                {units.map((u) => (
                    <span key={u.label} className="flex flex-col items-center gap-1">
                        <FlipTile value={u.v} wrap={u.wrap} tone={tone} big={big} />
                        {big && <span aria-hidden="true" className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{u.label}</span>}
                    </span>
                ))}
            </span>
        </div>
    );
}