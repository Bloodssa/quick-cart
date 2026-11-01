import { useState } from "react";
import { Star } from "lucide-react";

const LABELS = ["Terrible", "Poor", "Average", "Good", "Excellent"];

export default function StarInput({ value, onChange, disabled }) {
    const [hover, setHover] = useState(0);
    const shown = hover || value;

    return (
        <div className="flex items-center gap-3">
            <div role="radiogroup" aria-label="Your rating" className="flex" onMouseLeave={() => setHover(0)}>
                {LABELS.map((label, i) => {
                    const n = i + 1;
                    return (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={value === n}
                            aria-label={`${n} star${n > 1 ? "s" : ""}, ${label}`}
                            disabled={disabled}
                            onClick={() => onChange(n)}
                            onMouseEnter={() => setHover(n)}
                            className={`rounded p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-100 ${n <= shown ? "text-accent-100" : "text-gray-300"}`}
                        >
                            <Star size={28} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                        </button>
                    );
                })}
            </div>
            <span className="text-sm font-medium text-gray-600" aria-live="polite">{shown ? LABELS[shown - 1] : ""}</span>
        </div>
    );
}