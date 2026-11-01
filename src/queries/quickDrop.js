import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelQuickDrop, createQuickDrop, getLiveQuickDrops, getQuickDrops } from "../api/quickDrops";
import { getErrorMessage } from "../api/client";

export const quickDropKeys = {
    all: ["quick-drops"],
    list: (status) => [...quickDropKeys.all, "list", status ?? "all"],
    live: () => [...quickDropKeys.all, "live"],
};

export const useQuickDrops = (status) =>
    useQuery({
        queryKey: quickDropKeys.list(status),
        queryFn: ({ signal }) => getQuickDrops({ status }, signal),
        placeholderData: keepPreviousData,
    });

// Storefront: use this to show the current drop price on product cards.
export const useLiveQuickDrops = () =>
    useQuery({
        queryKey: quickDropKeys.live(),
        queryFn: ({ signal }) => getLiveQuickDrops(signal),
    });

export function useCreateQuickDrop() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createQuickDrop,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quickDropKeys.all });
            toast.success("Quick Drop created");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}

export function useCancelQuickDrop() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelQuickDrop,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quickDropKeys.all });
            toast.success("Quick Drop cancelled");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}