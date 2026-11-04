import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import { useDebouncedValue } from "../../hooks/useDebounce";
import { formatPrice } from "../../lib/format";
import { useDeleteProduct, useProducts } from "../../queries/products";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ConfirmModal } from "../../components/ui/AppModal";

const PAGE_SIZE = 10;

function SkeletonRows() {
    return Array.from({ length: 5 }, (_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-200 last:border-0">
            <td colSpan={5} className="px-4 py-4">
                <div className="h-10 rounded-md bg-gray-100" />
            </td>
        </tr>
    ));
}

export default function Products() {
    const [searchInput, setSearchInput] = useState("");
    const search = useDebouncedValue(searchInput.trim(), 400);
    const [page, setPage] = useState(1);
    const [productToDelete, setProductToDelete] = useState(null);
    useDocumentTitle("Products");

    const [lastSearch, setLastSearch] = useState(search);
    if (search !== lastSearch) {
        setLastSearch(search);
        setPage(1);
    }

    const { data, isPending, error, isPlaceholderData } = useProducts({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
    });
    const remove = useDeleteProduct();

    const products = data?.products ?? [];
    const totalResults = data?.totalResults ?? 0;
    const totalPages = data ? Math.max(1, Math.ceil(data.totalResults / data.pageSize)) : 1;

    const failure = error ?? remove.error;
    const errorMessage = failure ? getErrorMessage(failure) : null;

    const closeDeleteModal = () => {
        if (!remove.isPending) setProductToDelete(null);
    };

    const confirmDelete = () => {
        if (!productToDelete) return;

        const { id, name } = productToDelete;

        remove.mutate(id, {
            onSuccess: () => {
                setProductToDelete(null);
                toast.success(`${name} deleted`);
                if (products.length === 1 && page > 1) setPage((current) => current - 1);
            },
            // close the modal so the error alert on the page is visible
            onError: () => setProductToDelete(null),
        });
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-heading">Products</h1>
                    <p className="text-sm text-neutral-500">{isPending ? "Loading…" : `${totalResults} products`}</p>
                </div>
                <Link
                    to="/admin/products/new"
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-accent-100 px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                    <Plus size={18} aria-hidden="true" />
                    Add product
                </Link>
            </div>

            <div role="search" className="relative mb-4 max-w-sm">
                <Search size={16} aria-hidden="true" className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400" />
                <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Escape" && setSearchInput("")}
                    aria-label="Search products by name"
                    placeholder="Search by product name…"
                    className="h-11 w-full rounded-md border border-gray-300 bg-white pr-9 pl-9 text-sm focus:border-accent-100 focus:ring-2 focus:ring-accent-100/20 focus:outline-none"
                />
                {searchInput && (
                    <button
                        type="button"
                        onClick={() => setSearchInput("")}
                        aria-label="Clear search"
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-700"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {errorMessage && (
                <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {errorMessage}
                </p>
            )}

            <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-300 bg-gray-50 text-neutral-600">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Product</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Price</th>
                            <th className="px-4 py-3 font-semibold">Stock</th>
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={isPlaceholderData ? "opacity-60" : ""}>
                        {isPending && <SkeletonRows />}

                        {!isPending && !isPlaceholderData && products.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                                    {search ? `No products match "${search}".` : "No products found."}
                                </td>
                            </tr>
                        )}

                        {products.map((product) => {
                            const cover = product.images.find((i) => i.isDefault) ?? product.images[0];
                            const stockColor =
                                product.stockQuantity === 0 ? "text-red-600"
                                    : product.stockQuantity <= 5 ? "text-amber-600"
                                        : "text-neutral-700";

                            return (
                                <tr key={product.id} className="border-b border-gray-200 last:border-0">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 shrink-0 overflow-hidden rounded-md bg-gray-50">
                                                {cover && <img src={cover.imageUrl} alt="" className="h-full w-full object-contain" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="line-clamp-2 font-semibold text-heading">{product.name}</p>
                                                {product.isFeatured && (
                                                    <span className="rounded bg-accent-100/10 px-1.5 py-0.5 text-xs font-medium text-accent-100">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600">{product.categoryName}</td>
                                    <td className="px-4 py-3 font-medium">{formatPrice(product.price)}</td>
                                    <td className={`px-4 py-3 font-medium ${stockColor}`}>{product.stockQuantity}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <Link
                                                to={`/admin/products/${product.id}/edit`}
                                                aria-label={`Edit ${product.name}`}
                                                className="rounded-md p-2 text-neutral-600 hover:bg-gray-100"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setProductToDelete(product)}
                                                disabled={remove.isPending}
                                                aria-label={`Delete ${product.name}`}
                                                className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Delete product */}
            <ConfirmModal
                isOpen={Boolean(productToDelete)}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                destructive
                icon={Trash2}
                title="Delete this product?"
                message={
                    <>
                        <span className="font-semibold text-heading">{productToDelete?.name}</span> and its images
                        will be permanently removed. This can't be undone.
                    </>
                }
                confirmLabel="Delete"
                pendingLabel="Deleting…"
                isPending={remove.isPending}
            />
        </div>
    );
}