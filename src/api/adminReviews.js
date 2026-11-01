import { api } from "./client";

// paged reviews for the admin (params: filter, withPhotos, search, page, pageSize)
export const getAdminReviews = async (params, signal) => {
    const { data } = await api.get("/admin/reviews", { params, signal });
    return data;
};

// create the reply, or edit it if one exists
export const replyToReview = async ({ id, reply }) => {
    const { data } = await api.put(`/admin/reviews/${id}/reply`, { reply });
    return data;
};

export const deleteReviewReply = async (id) => {
    const { data } = await api.delete(`/admin/reviews/${id}/reply`);
    return data;
};

// moderation: remove a spam or abusive review
export const deleteReviewAsAdmin = async (id) => {
    const { data } = await api.delete(`/reviews/${id}`);
    return data;
};