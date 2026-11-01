import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDashboardData, getSalesReport, downloadSalesReportPdf} from "../api/dashboard";
import { getErrorMessage } from "../api/client";

export const dashboardKeys = {
    all: ["admin", "dashboard"],
    sales: (params) => ["admin", "reports", "sales", params],
};

export const useDashboard = () =>
    useQuery({
        queryKey: dashboardKeys.all,
        queryFn: ({signal}) => getDashboardData(signal),
        refetchInterval: 60_000,
        staleTime: 30_0000
    });

export const useSalesReport = (params, enabled = true) =>
    useQuery({
        queryKey: dashboardKeys.sales(params),
        queryFn: ({ signal }) => getSalesReport(params, signal),
        placeholderData: keepPreviousData,
        enabled, // stays off while the date range is invalid
    });

export const useDownloadSalesPdf = () =>
    useMutation({
        mutationFn: downloadSalesReportPdf,
        onSuccess: () => toast.success("PDF downloaded"),
        onError: (e) => toast.error(getErrorMessage(e)),
    });