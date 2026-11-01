import { Link } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Card, ErrorState, PageHeader, primaryBtn } from "../../components/admin/ui";
import { useDashboard } from "../../queries/dashboard";
import ChartTheme from "../../components/dashboard/ChartTheme";
import DashboardStats from "../../components/dashboard/DashboardStats";
import RevenueChart from "../../components/dashboard/RevenueChart";
import OrderStatusChart from "../../components/dashboard/OrderStatusChart";
import NeedsActionTable from "../../components/dashboard/NeedsActionTable";
import TopProducts from "../../components/dashboard/TopProducts";
import RestockList from "../../components/dashboard/RestockList";
import ReviewsToAnswer from "../../components/dashboard/ReviewsToAnswer";

export default function Dashboard() {
    useDocumentTitle("Dashboard");
    const { data, isPending, isError, refetch } = useDashboard();

    if (isError) return <ErrorState onRetry={refetch} />;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Dashboard"
                subtitle="What needs your attention today."
                action={<Link to="/admin/orders?status=Pending" className={primaryBtn}>Review orders</Link>}
            />

            <DashboardStats data={data} loading={isPending} />

            <ChartTheme>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="min-w-0 p-5 lg:col-span-2">
                        <h2 className="mb-4 text-base font-bold">Paid revenue per day</h2>
                        <RevenueChart days={data?.revenueByDay} loading={isPending} />
                    </Card>
                    <Card className="min-w-0 p-5">
                        <h2 className="mb-4 text-base font-bold">Orders by status</h2>
                        <OrderStatusChart counts={data?.ordersByStatus} loading={isPending} />
                    </Card>
                </div>
            </ChartTheme>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                    <NeedsActionTable orders={data?.needsAction} loading={isPending} />
                    <ReviewsToAnswer reviews={data?.reviews} loading={isPending} />
                </div>
                <div className="flex flex-col gap-4">
                    <TopProducts products={data?.topProducts} />
                    <RestockList items={data?.restock} />
                </div>
            </div>
        </div>
    );
}