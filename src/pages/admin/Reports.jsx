import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Card, PageHeader, primaryBtn } from "../../components/admin/ui";
import ChartTheme from "../../components/dashboard/ChartTheme";
import RevenueChart from "../../components/dashboard/RevenueChart";
import TopProducts from "../../components/dashboard/TopProducts";
import ReportFilters from "../../components/reports/ReportFilters";
import ReportSummary from "../../components/reports/ReportSummary";
import TransactionsTable from "../../components/reports/TransactionsTable";
import { daysInRange, rangeFor } from "../../lib/dates";
import { useDownloadSalesPdf, useSalesReport } from "../../queries/dashboard";

const PAGE_SIZE = 10;
const MAX_DAYS = 366;

export default function Reports() {
    useDocumentTitle("Sales Reports");
    const [range, setRange] = useState(() => rangeFor(29));
    const [page, setPage] = useState(1);

    const rangeError =
        !range.from || !range.to ? "Choose both dates."
        : range.from > range.to ? "The start date must be on or before the end date."
        : daysInRange(range) > MAX_DAYS ? `Choose a range of ${MAX_DAYS} days or less.`
        : null;

    const params = useMemo(() => ({ ...range, page, pageSize: PAGE_SIZE }), [range, page]);
    const { data, isPending, isError, refetch } = useSalesReport(params, !rangeError);
    const pdf = useDownloadSalesPdf();

    const totalPages = Math.max(1, Math.ceil((data?.totalResults ?? 0) / PAGE_SIZE));
    const rows = data?.transactions ?? [];

    function handleRange(next) {
        setRange(next);
        setPage(1);
    }

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Sales Reports"
                subtitle="Basic transaction records for a date range."
                action={
                    <div className="flex flex-wrap gap-2">
                        <button type="button" className={primaryBtn} disabled={Boolean(rangeError) || pdf.isPending}
                            onClick={() => pdf.mutate(range)}>
                            <FileDown size={16} className="mr-1.5" aria-hidden="true" />
                            {pdf.isPending ? "Preparing PDF…" : "Download PDF"}
                        </button>
                    </div>
                }
            />

            <ReportFilters range={range} onChange={handleRange} error={rangeError} />
            <ReportSummary summary={data?.summary} loading={isPending && !rangeError} />

            <ChartTheme>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="min-w-0 p-5 lg:col-span-2">
                        <h2 className="mb-4 text-base font-bold">Paid revenue per day</h2>
                        <RevenueChart days={data?.revenueByDay} loading={isPending && !rangeError} />
                    </Card>
                    <TopProducts products={data?.topProducts} title="Top products" />
                </div>
            </ChartTheme>

            <TransactionsTable
                rows={rows}
                total={data?.totalResults}
                loading={isPending && !rangeError}
                isError={isError}
                onRetry={refetch}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}