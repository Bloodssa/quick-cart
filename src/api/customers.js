import { api } from "./client";

export const getCustomers = async (params, signal) => {
    const { data } = await api.get("/admin/customers", { params, signal });
    return data;
};

export const getCustomer = async (id, signal) => {
    const { data } = await api.get(`/admin/customers/${id}`, { signal });
    return data;
};