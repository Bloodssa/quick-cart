import { Card, EmptyState, ErrorState, Pagination, TableSkeleton, Th, inputCls, tdCls } from "../admin/ui";
import { formatDate, formatPrice } from "../../lib/format";

export default function CustomerTable({
    rows = [], loading, isError, onRetry,
    search, onSearch, selectedId, onSelect,
    page, totalPages, onPageChange,
}) {
    return (
        <Card className="min-w-0 flex-[2_1_520px] overflow-hidden">
            <div className="border-b border-gray-300 p-4">
                <label htmlFor="cust-q" className="sr-only">Search customers</label>
                <input id="cust-q" type="search" placeholder="Search by name or email" value={search}
                    onChange={(e) => onSearch(e.target.value)} className={`${inputCls} max-w-sm`} />
            </div>

            {loading ? <TableSkeleton /> : isError ? <ErrorState onRetry={onRetry} /> : rows.length === 0 ? (
                <EmptyState title="No customers found" message={search ? "Try a different search." : "Customers appear here after they register."} />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-150 border-collapse">
                        <thead><tr><Th>Customer</Th><Th>Orders</Th><Th>Total spent</Th><Th>Joined</Th></tr></thead>
                        <tbody>
                            {rows.map((c) => (
                                <tr key={c.id} className={selectedId === c.id ? "bg-accent-50" : ""}>
                                    <td className={tdCls}>
                                        <button type="button" onClick={() => onSelect(c.id)} aria-pressed={selectedId === c.id} className="text-left">
                                            <span className="block font-semibold hover:underline">{c.fullName}</span>
                                            <span className="block text-xs text-gray-600">{c.email}</span>
                                        </button>
                                    </td>
                                    <td className={tdCls}>{c.orderCount}</td>
                                    <td className={tdCls}>{formatPrice(c.totalSpent)}</td>
                                    <td className={tdCls}>{formatDate(c.createdAt)}</td>
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