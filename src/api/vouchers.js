import { api } from "./client";

export const getVouchers = async (params, signal) => {
    const { data } = await api.get('/vouchers', { params, signal });
    return data;
}

export const createVoucher = async (values) => {
    const { data } = await api.post('/vouchers', values);
    return data;
}

export const setVoucherActive = async ({ id, isActive }) => {
    const { data } = await api.post(`/vouchers/${id}/active`, { isActive });
    return data;
}