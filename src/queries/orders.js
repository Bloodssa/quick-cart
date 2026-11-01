import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placeOrder, getMyOrder, getMyOrders, cancelOrder, getShippingQuote } from "../api/orders";
import { cartKeys } from "./cart";
import { productKeys } from "./products";

export const orderKeys = {
    all: ["orders"],
    lists: () => [...orderKeys.all, "list"],
    list: (params) => [...orderKeys.lists(), params],
    detail: (id) => [...orderKeys.all, "detail", String(id)]
};

export const useMyOrder = (id) =>
    useQuery({
        queryKey: orderKeys.detail(id),
        queryFn: ({ signal }) => getMyOrder(id, signal),
        enabled: Boolean(id)
    });

// note of there is query param use keepPreviousData
export const useMyOrders = (params) =>
    useQuery({
        queryKey: orderKeys.list(params),
        queryFn: ({ signal }) => getMyOrders(params, signal),
        placeholderData: keepPreviousData
    });

export const useShippingQuote = (params, enabled = true) =>
    useQuery({
        queryKey: ["shipping-quote", params],
        queryFn: ({ signal }) => getShippingQuote(params, signal),
        enabled,
        placeholderData: keepPreviousData,
    });

export const usePlaceOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: placeOrder,
        onSuccess: (order) => {
            queryClient.setQueryData(orderKeys.detail(order.id), order);
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: cartKeys.all });    // ordered rows leave the cart
            queryClient.invalidateQueries({ queryKey: productKeys.all }); // stock changed
        }
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelOrder,
        onSuccess: (order) => {
            queryClient.setQueryData(orderKeys.detail(order.id), order);
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: productKeys.all }); // items were restocked
        }
    });
};