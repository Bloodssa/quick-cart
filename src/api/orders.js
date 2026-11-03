import { api } from "./client";

export const placeOrder = async ({ addressId, paymentMethod, cartItemIds, voucherCode }) => {
    const { data } = await api.post("/orders", { addressId, paymentMethod, cartItemIds, voucherCode });
    return data;
};

// get all orders
export const getMyOrders = async (params, signal) => {
    const { data } = await api.get("/orders", { params, signal });
    return data;
}

// get specific order
export const getMyOrder = async (id, signal) => {
    const { data } = await api.get(`/orders/${id}`, { signal });
    return data;
};

export const cancelOrder = async (id) => {
    const { data } = await api.post(`/orders/${id}/cancel`);
    return data; // return the order cancelled
};

// shipping fee for an address and cart subtotal (the server is the single source of truth)
export const getShippingQuote = async (params, signal) => {
    const { data } = await api.get("/orders/shipping-quote", { params, signal });
    return data;
};

export const previewOrder = async (values, signal) => {
    const { data } = await api.post('/orders/preview', values, { signal });
    return data;
}