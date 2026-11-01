import { api } from "./client";

export const getQuickDrops = async (params, signal) => {
    const { data } = await api.get('/quick-drops', { params, signal });
    return data;
}

export const getLiveQuickDrops = async (signal) => {
    const { data } = await api.get('/quick-drops/live', { signal });
    return data;
}


export const createQuickDrop = async (values) => {
    const { data } = await api.post('/quick-drops', values);
    return data;
};

export const cancelQuickDrop = async (id) => {
    const { data } = await api.post(`/quick-drops/${id}/cancel`);
    return data;
}