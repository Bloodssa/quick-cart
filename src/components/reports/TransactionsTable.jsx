import { Card, EmptyState, ErrorState, Pagination, Pill, TableSkeleton, Th, tdCls } from "../admin/ui";
import { formatDate, formatPrice } from "../../lib/format";

const PAY_TONE = { Paid: "green", Pending: "yellow", Failed: "red" };

export default function TransactionsTable({ rows = [], loading, isError, onRetry, page, totalPages, onPageChange, total }) {
    return (
        <Card className="overflow-hidden">
            <h2 className="px-5 py-4 text-base font-bold">Transactions{total ? ` (${total})` : ""}</h2>

            {loading ? <TableSkeleton /> : isError ? <ErrorState onRetry={onRetry} /> : rows.length === 0 ? (
                <EmptyState title="No transactions in this range" message="Try a wider date range." />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-170 border-collapse">
                        <thead>
                            <tr>
                                <Th>Date</Th>
                                <Th>Order</Th>
                                <Th>Customer</Th>
                                <Th>Method</Th>
                                <Th>Payment</Th>
                                <Th align="right">Total</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.orderNumber}>
                                    <td className={tdCls}>{formatDate(r.date)}</td>
                                    <td className={`${tdCls} font-semibold`}>{r.orderNumber}</td>
                                    <td className={tdCls}>{r.customerName}</td>
                                    <td className={tdCls}>{r.paymentMethod}</td>
                                    <td className={tdCls}><Pill tone={PAY_TONE[r.paymentStatus] ?? "gray"}>{r.paymentStatus}</Pill></td>
                                    <td className={`${tdCls} text-right`}>{formatPrice(r.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
        </Card>
    );
}