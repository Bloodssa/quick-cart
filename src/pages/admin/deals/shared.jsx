export const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export const when = (value) =>
    new Date(value).toLocaleString("en-PH", {
        timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });

const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

// "now + minutes", rounded up to the next 5 minutes, as a datetime-local value
export const roundedFromNow = (minutes) => {
    const d = new Date(Date.now() + minutes * 60_000);
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
    return toLocalInput(d);
};

// same math as the server, only used for the preview in the form
export const dealPrice = (type, value, price) => {
    const after = type === "Percent" ? Math.round(price * (100 - value)) / 100 : price - value;
    return Math.max(after, 0.01);
};

export const discountLabel = (type, value) =>
    type === "Percent" ? `${value}% off` : `${peso.format(value)} off`;

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-100";
export const card = "rounded-md border border-gray-300 bg-white";
export const field = `w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 ${focusRing}`;
export const primaryButton = `rounded-md bg-accent-100 px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60 ${focusRing}`;
export const ghostButton = `rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-gray-50 disabled:opacity-60 ${focusRing}`;

const DOT = {
    Active: "bg-accent-100",
    Scheduled: "bg-amber-500",
    UsedUp: "bg-neutral-900",
};
const LABEL = { UsedUp: "Fully claimed" };

export function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-neutral-900 ${status === "Active" ? "bg-accent-50" : "bg-gray-100"}`}
        >
            <span className={`size-1.5 rounded-full ${DOT[status] ?? "bg-gray-400"}`} />
            {LABEL[status] ?? status}
        </span>
    );
}

export function FilterBar({ label, options, value, onChange }) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-1">
            {options.map(([id, text]) => (
                <button
                    key={id || "all"} type="button" aria-pressed={value === id} onClick={() => onChange(id)}
                    className={`rounded-md px-3 py-1 text-sm ${focusRing} ${value === id
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-500 hover:bg-gray-100 hover:text-neutral-900"}`}
                >
                    {text}
                </button>
            ))}
        </div>
    );
}

export function EmptyState({ icon: Icon, title, text }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 bg-white py-12 text-center">
            <span className="grid size-12 place-items-center rounded-md bg-accent-50">
                <Icon size={22} className="text-accent-100" />
            </span>
            <p className="font-medium text-neutral-900">{title}</p>
            <p className="max-w-sm text-sm text-neutral-500">{text}</p>
        </div>
    );
}