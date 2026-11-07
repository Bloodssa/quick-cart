import { 
    keepPreviousData, 
    useInfiniteQuery,
    useMutation, 
    useQuery, 
    useQueryClient 
} from "@tanstack/react-query";
import {
    createProduct, deleteProduct, deleteProductImage, getProductById,
    getProducts, setDefaultProductImage, updateProduct, adjustProductStock,
    getStockSummary
} from "../api/products";
import { toast } from "sonner";
import { getErrorMessage } from "../api/client";

export const productKeys = {
    all: ["products"],
    lists: () => [...productKeys.all, "list"],
    list: (params) => [...productKeys.lists(), params],
    detail: (id) => [...productKeys.all, "detail", String(id)],
};

export const useProducts = (params) => 
    useQuery({
        queryKey: productKeys.list(params),
        queryFn: ({ signal }) => getProducts(params, signal), // the signal cancels a request that is no longer needed
        placeholderData: keepPreviousData // keep the old rows visible while the next page or search loads
    });

export const useProduct = (id) => 
    useQuery({
        queryKey: productKeys.detail(id),
        queryFn: ({ signal }) => getProductById(id, signal),
        enabled: Boolean(id)
    });

export function useSaveProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, values }) => (id ? updateProduct(id, values) : createProduct(values)),
        onSuccess: (product) => {
            queryClient.setQueryData(productKeys.detail(product.id), product);   // the detail page is current immediately
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });     // lists refetch only the ones on screen
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: (_, id) => {
            queryClient.removeQueries({ queryKey: productKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
}

function useImageMutation(mutationFn) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        // the cover image also shows in lists, so refresh everything product-related
        onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
    });
}

export function useAdjustStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adjustProductStock,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.all }); // product cards show stock too
            toast.success("Stock updated");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
    });
}

export const useStockSummary = () =>
    useQuery({
        queryKey: [...productKeys.all, "stock-summary"],
        queryFn: ({ signal }) => getStockSummary(signal),
    });

export const useDeleteProductImage = () => useImageMutation(({ productId, imageId }) => deleteProductImage(productId, imageId));
export const useSetDefaultImage = () => useImageMutation(({ productId, imageId }) => setDefaultProductImage(productId, imageId));

export const useInfiniteProducts = (params) =>
    useInfiniteQuery({
        queryKey: [...productKeys.lists(), "infinite", params],
        queryFn: ({ pageParam, signal }) => getProducts({ ...params, page: pageParam }, signal),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const loaded = allPages.reduce((count, p) => count + p.products.length, 0);
            return loaded < lastPage.totalResults ? allPages.length + 1 : undefined; // undefined = no more pages
        },
        placeholderData: keepPreviousData,
    });