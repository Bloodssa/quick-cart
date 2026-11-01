export const ACCENT = "#ff5e1f";

export const STATUS_COLORS = {
    Pending: "#eab308",
    Confirmed: "#3b82f6",
    Processing: "#6366f1",
    Completed: "#22c55e",
    Cancelled: "#ef4444",
};

export const STATUSES = Object.keys(STATUS_COLORS);

export const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric" });

// ensure that the date will be treat to utc -> formatDate
export function age(iso, now) {
    const t = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
    const mins = Math.max(0, Math.floor((now - t) / 60_000));
    if (mins < 60) return { label: `${mins}m`, stale: false };
    const hours = Math.floor(mins / 60);
    if (hours < 24) return { label: `${hours}h`, stale: false };
    return { label: `${Math.floor(hours / 24)}d ${hours % 24}h`, stale: true };
}

export function deltaText(today, yesterday) {
    const diff = today - yesterday;

    if (diff === 0) return "Same as yesterday";

    if (diff > 0) {
        return `+${diff} compared to yesterday`;
    }

    return `${Math.abs(diff)} fewer than yesterday`;
}

export const ORDER_STATUS_TONE = {
    Pending: "yellow",
    Confirmed: "blue",
    Processing: "blue",
    Completed: "green",
    Cancelled: "red",
};
