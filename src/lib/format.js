export const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);

export const formatDate = (value) => {
    // the API sends UTC without a "Z", so add it and let the browser convert to local time
    const iso = /Z|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;

    return new Date(iso).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

export function formatSold(n) {
    if (n < 1000) return String(n);
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}