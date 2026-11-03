import { formatPrice } from "./format";

// deal info for one order line; regularPrice is null on old orders
export function getDeal(item) {
    const onDeal = item.regularPrice != null && item.regularPrice > item.unitPrice;
    if (!onDeal) return null;

    const saved = item.regularPrice - item.unitPrice;
    const percent = Math.round((saved / item.regularPrice) * 100);

    // an amount deal can round to 0%, so show the peso amount instead
    return {
        regularPrice: item.regularPrice,
        label: percent >= 1 ? `-${percent}%` : `-${formatPrice(saved)}`,
    };
}

// total saved by deals across the whole order
export function getDealSavings(items) {
    return items.reduce(
        (sum, i) => sum + ((i.regularPrice ?? i.unitPrice) - i.unitPrice) * i.quantity,
        0
    );
}