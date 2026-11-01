import { CheckCircle2, Truck } from "lucide-react";
import { formatPrice } from "../../lib/format";

const label = (percent) => (percent === 100 ? "free shipping" : `${percent}% off shipping`);

export default function ShippingNudge({ quote, subtotal }) {
    if (!quote || quote.fee === 0) return null;

    const progress = Math.min(100, (subtotal / quote.freeShippingThreshold) * 100);
    const free = !quote.next; // the last tier is free shipping, so no next tier means it's reached

    return (
        <div className="mt-4 rounded-md bg-accent-50 p-3 text-sm">
            <div className="flex items-start gap-2.5">
                {free ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
                ) : (
                    <Truck size={20} className="mt-0.5 shrink-0 text-accent-100" aria-hidden="true" />
                )}
                <div className="min-w-0">
                    <p className={`font-medium ${free ? "text-green-600" : "text-heading"}`}>
                        {quote.next ? (
                            <>Add <b>{formatPrice(quote.next.remaining)}</b> more to get {label(quote.next.percent)}.</>
                        ) : (
                            "You got free shipping!"
                        )}
                    </p>
                    {quote.discountPercent > 0 && quote.next && (
                        <p className="mt-0.5 text-xs text-neutral-500">You're already getting {quote.discountPercent}% off shipping.</p>
                    )}
                </div>
            </div>
            <div
                role="progressbar"
                aria-label="Progress to free shipping"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"
            >
                <div className={`h-full transition-all ${free ? "bg-green-600" : "bg-accent-100"}`} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}