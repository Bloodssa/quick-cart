import { StatCard } from "../admin/ui";
import { formatPrice } from "../../lib/format";

export default function ReportSummary({ summary, loading }) {
    return (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Paid revenue" value={summary && formatPrice(summary.paidRevenue)} loading={loading}
                hint={summary && `${summary.paidOrders} paid orders`} />
            <StatCard label="Orders" value={summary?.totalOrders} loading={loading} />
            <StatCard label="Average order" value={summary && formatPrice(summary.averageOrderValue)} loading={loading} />
            <StatCard label="Cancelled" value={summary?.cancelledOrders} loading={loading} />
        </div>
    );
}