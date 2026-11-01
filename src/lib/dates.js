export const toInputDate = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

export function rangeFor(daysBack) {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - daysBack);
    return { from: toInputDate(from), to: toInputDate(to) };
}

export const daysInRange = ({ from, to }) => Math.round((new Date(to) - new Date(from)) / 86_400_000) + 1;