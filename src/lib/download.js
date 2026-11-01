export function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(rows, filename) {
    const head = ["Date", "Order", "Customer", "Payment method", "Payment status", "Total"];
    const body = rows.map((r) => [r.date, r.orderNumber, r.customerName, r.paymentMethod, r.paymentStatus, r.total]);
    const csv = [head, ...body]
        .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
        .join("\n");

    saveBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), filename); // BOM so Excel reads UTF-8
}