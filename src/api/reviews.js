import { api } from "./client";

// rating summary: average, total, distribution, withPhotos count
export const getReviewSummary = async (productId, signal) => {
    const { data } = await api.get(`/products/${productId}/reviews/summary`, { signal });
    return data;
};

// paged reviews of a product (params: rating, withPhotos, sort, page, pageSize)
export const getReviews = async (productId, params, signal) => {
    const { data } = await api.get(`/products/${productId}/reviews`, { params, signal });
    return data;
};

// the logged-in customer's own review + whether they may write one
export const getMyReview = async (productId, signal) => {
    const { data } = await api.get(`/products/${productId}/reviews/mine`, { signal });
    return data;
};

// multipart for the review photos
function toFormData({ rating, comment, images = [], removeImageIds = [] }) {
    const form = new FormData();
    form.append("rating", String(rating));
    form.append("comment", comment ?? "");
    images.forEach((file) => form.append("images", file));
    removeImageIds.forEach((id) => form.append("removeImageIds", String(id)));
    return form;
}

export const createReview = async ({ productId, ...values }) => {
    const { data } = await api.post(`/products/${productId}/reviews`, toFormData(values));
    return data;
};

export const updateReview = async ({ productId, ...values }) => {
    const { data } = await api.put(`/products/${productId}/reviews/mine`, toFormData(values));
    return data;
};

export const deleteReview = async (productId) => {
    const { data } = await api.delete(`/products/${productId}/reviews/mine`);
    return data;
};