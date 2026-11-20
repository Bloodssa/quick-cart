import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({ value, max, disabled = false, onChange, onLimitReached }) {
    const buttonClass = "grid h-full w-9 place-items-center hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";
    const atMax = value >= max;

    function handleIncrease() {
        if (atMax) {
            onLimitReached?.();   // show the toast, don't change the quantity
            return;
        }
        onChange(value + 1);
    }

    return (
        <div className="inline-flex h-9 items-center overflow-hidden rounded-md border border-gray-300">
            <button
                type="button"
                aria-label="Decrease quantity"
                disabled={disabled || value <= 1}
                onClick={() => onChange(value - 1)}
                className={buttonClass}
            >
                <Minus size={14} />
            </button>

            <span aria-live="polite" className="w-8 text-center text-sm font-semibold">
                {value}
            </span>
            <button
                type="button"
                aria-label="Increase quantity"
                aria-disabled={disabled || atMax}
                disabled={disabled}   // real disabled only for the busy/out-of-stock state
                onClick={handleIncrease}
                className={`${buttonClass} ${atMax ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""}`}
            >
                <Plus size={14} />
            </button>
        </div>
    );
}