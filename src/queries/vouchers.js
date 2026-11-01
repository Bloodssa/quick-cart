import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createVoucher, getVouchers, setVoucherActive } from "../api/vouchers";
import { getErrorMessage } from "../api/client";

export const voucherKeys = {
    all: ["vouchers"],
    list: (status) => [...voucherKeys.all, "list", status ?? "all"],
};

export const useVouchers = (status) =>
    useQuery({
        queryKey: voucherKeys.list(status),
        queryFn: ({ signal }) => getVouchers({ status }, signal),
        placeholderData: keepPreviousData,
    });

export function useCreateVoucher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createVoucher,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: voucherKeys.all });
            toast.success("Voucher created");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}

export function useSetVoucherActive() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: setVoucherActive,
        onSuccess: (voucher) => {
            queryClient.invalidateQueries({ queryKey: voucherKeys.all });
            toast.success(voucher.isActive ? "Voucher enabled" : "Voucher disabled");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}