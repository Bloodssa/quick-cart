import { api } from "./client";

export const getDeals = async (params, signal) => {
    const { data } = await api.get('/deals', { params, signal });
    return data;
}

export const getActiveDeals = async (signal) => {
    const { data } = await api.get('/deals/active', { signal });
    return data;
}

export const createDeal = async (values) => {
    const { data } = await api.post('/deals', values);
    return data;
}

export const endDeal = async (id) => {
    const { data } = await api.post(`/deals/${id}/end`);
    return data;
}