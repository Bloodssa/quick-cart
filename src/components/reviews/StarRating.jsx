import { Star } from "lucide-react";

export default function StarRating({ value = 0, size = 16, className = "" }) {
    const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
    const stars = () =>
        Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" aria-hidden="true" />
        ));

    return (
        <span role="img" aria-label={`${value.toFixed(1)} out of 5 stars`} className={`relative inline-flex ${className}`}>
            <span className="flex text-gray-300">{stars()}</span>
            <span className="absolute inset-y-0 left-0 flex overflow-hidden text-accent-100" style={{ width: `${pct}%` }}>
                {stars()}
            </span>
        </span>
    );
}