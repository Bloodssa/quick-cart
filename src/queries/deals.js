import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createDeal, endDeal, getActiveDeals, getDeals } from "../api/deals";
import { getErrorMessage } from "../api/client";

export const dealKeys = {
    all: ["deals"],
    list: (status) => [...dealKeys.all, "list", status ?? "all"],
    active: () => [...dealKeys.all, "active"],
};

export const useDeals = (status) =>
    useQuery({
        queryKey: dealKeys.list(status),
        queryFn: ({ signal }) => getDeals({ status }, signal),
        placeholderData: keepPreviousData,
    });

// Storefront: every product on discount right now. Use it on product cards and the cart.
export const useActiveDeals = () =>
    useQuery({
        queryKey: dealKeys.active(),
        queryFn: ({ signal }) => getActiveDeals(signal),
    });

export function useCreateDeal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createDeal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dealKeys.all });
            toast.success("Discount created");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}

export function useEndDeal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: endDeal,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dealKeys.all });
            toast.success("Discount ended");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}