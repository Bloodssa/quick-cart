import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../api/client";
import {
    createReview, deleteReview, getMyReview, getReviews, getReviewSummary, updateReview,
} from "../api/reviews";

export const reviewKeys = {
    all: (productId) => ["reviews", Number(productId)],
    summary: (productId) => [...reviewKeys.all(productId), "summary"],
    list: (productId, params) => [...reviewKeys.all(productId), "list", params],
    mine: (productId) => [...reviewKeys.all(productId), "mine"],
};

export const useReviewSummary = (productId) =>
    useQuery({
        queryKey: reviewKeys.summary(productId),
        queryFn: ({ signal }) => getReviewSummary(productId, signal),
    });

export const useReviews = (productId, params) =>
    useQuery({
        queryKey: reviewKeys.list(productId, params),
        queryFn: ({ signal }) => getReviews(productId, params, signal),
        placeholderData: keepPreviousData,
    });

export const useMyReview = (productId, enabled) =>
    useQuery({
        queryKey: reviewKeys.mine(productId),
        queryFn: ({ signal }) => getMyReview(productId, signal),
        enabled,
    });

// summary, list and "mine" all share the ["reviews", productId] prefix
function useReviewMutation(mutationFn, successMessage) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (_, vars) => {
            const productId = typeof vars === "object" ? vars.productId : vars;
            queryClient.invalidateQueries({ queryKey: reviewKeys.all(productId) });
            toast.success(successMessage);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}

export const useCreateReview = () => useReviewMutation(createReview, "Thanks for your review");
export const useUpdateReview = () => useReviewMutation(updateReview, "Review updated");
export const useDeleteReview = () => useReviewMutation(deleteReview, "Review deleted");