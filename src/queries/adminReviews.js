import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "../api/client";
import { deleteReviewAsAdmin, deleteReviewReply, getAdminReviews, replyToReview } from "../api/adminReviews";

export const adminReviewKeys = {
    all: ["admin-reviews"],
    list: (params) => [...adminReviewKeys.all, "list", params],
};

export const useAdminReviews = (params) =>
    useQuery({
        queryKey: adminReviewKeys.list(params),
        queryFn: ({ signal }) => getAdminReviews(params, signal),
        placeholderData: keepPreviousData,
    });

function useAdminReviewMutation(mutationFn, successMessage) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminReviewKeys.all });
            toast.success(successMessage);
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}

export const useReplyToReview = () => useAdminReviewMutation(replyToReview, "Reply saved");
export const useDeleteReply = () => useAdminReviewMutation(deleteReviewReply, "Reply deleted");
export const useAdminDeleteReview = () => useAdminReviewMutation(deleteReviewAsAdmin, "Review deleted");