import { api } from "./client";
import { saveBlob } from "../lib/download";

export const getDashboardData = async (signal) => {
    const { data } = await api.get("/admin/dashboard", { signal });
    return data
}

export const getSalesReport = async (params, signal) => {
    const { data } = await api.get("/admin/reports/sales", { params, signal });
    return data;
};

export async function downloadSalesReportPdf({ from, to }) {
    try {
        const { data } = await api.get("/admin/reports/sales/pdf", {
            params: { from, to },
            responseType: "blob",
        });
        saveBlob(data, `sales-report_${from}_${to}.pdf`);
    } catch (err) {
        // With responseType "blob" an error body also arrives as a Blob; parse it so the real message shows
        if (err.response?.data instanceof Blob) {
            try {
                err.response.data = JSON.parse(await err.response.data.text());
            } catch {
                /* keep the original error */
            }
        }
        throw err;
    }
}