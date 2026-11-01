import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCustomer, getCustomers } from "../api/customers";

export const customerKeys = {
    list: (params) => ["admin", "customers", "list", params],
    detail: (id) => ["admin", "customers", "detail", id],
};

export const useCustomers = (params) =>
    useQuery({
        queryKey: customerKeys.list(params),
        queryFn: ({ signal }) => getCustomers(params, signal),
        placeholderData: keepPreviousData,
    });

export const useCustomer = (id) =>
    useQuery({
        queryKey: customerKeys.detail(id),
        queryFn: ({ signal }) => getCustomer(id, signal),
        enabled: Boolean(id),
    });