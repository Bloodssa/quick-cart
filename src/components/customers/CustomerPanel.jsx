import { Link } from "react-router-dom";
import { Card, EmptyState, ErrorState, Pill } from "../admin/ui";
import { ORDER_STATUS_TONE } from "../../lib/dashboard";
import { formatDate, formatPrice } from "../../lib/format";
import { useCustomer } from "../../queries/customers";

function Body({ id }) {
    const { data: c, isPending, isError, refetch } = useCustomer(id);

    if (isPending) return <div className="m-5 h-64 animate-pulse rounded bg-gray-100" />;
    if (isError) return <ErrorState onRetry={refetch} message="Could not load this customer." />;

    return (
        <div className="flex flex-col gap-4 p-5">
            <div>
                <h2 className="text-lg font-bold">{c.fullName}</h2>
                <p className="text-sm text-gray-600">{c.email}</p>
                <p className="text-xs text-gray-600">Joined {formatDate(c.createdAt)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Orders</p>
                    <p className="text-lg font-bold">{c.orderCount}</p>
                </div>
                <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Paid total</p>
                    <p className="text-lg font-bold">{formatPrice(c.totalSpent)}</p>
                </div>
            </div>

            <div>
                <h3 className="mb-2 text-sm font-bold">Recent orders</h3>
                {c.recentOrders.length === 0 ? (
                    <p className="text-sm text-gray-600">No orders yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {c.recentOrders.map((o) => (
                            <li key={o.id} className="flex items-center justify-between gap-2 rounded-md border border-gray-300 p-2.5 text-sm">
                                <div>
                                    <Link to={`/admin/orders/${o.id}`} className="font-semibold text-accent-300 hover:underline">{o.orderNumber}</Link>
                                    <p className="text-xs text-gray-600">{formatDate(o.orderDate)} · {formatPrice(o.total)}</p>
                                </div>
                                <Pill tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Pill>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default function CustomerPanel({ id }) {
    return (
        <Card className="min-w-0 flex-[1_1_320px]">
            {id ? <Body id={id} /> : <EmptyState title="Select a customer" message="Their details and recent orders appear here." />}
        </Card>
    );
}