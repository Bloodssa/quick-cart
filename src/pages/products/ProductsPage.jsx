import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import HomeLayout from "../../layouts/HomeLayout";
import ProductSection from "../../components/products/ProductSection";
import CategoryFilter from "../../components/CategoryFilter";
import { useCategories } from "../../queries/categories";
import { useInfiniteProducts } from "../../queries/products";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { getErrorMessage } from "../../api/client";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const PAGE_SIZE = 20;

const sortTitle = {
    newest: "New Arrivals",
    popular: "Best Sellers",
    trending: "Trending Now"
};

const ProductsPage = () => {
    useDocumentTitle("QuickCart | Products");
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();

    const sort = searchParams.get("sort");
    const categoryId = searchParams.get("categoryId") ?? "";
    const deals = searchParams.get("deals");
    const newArrivals = searchParams.get("newArrivals");
    const bestSellers = searchParams.get("bestSellers");
    const search = searchParams.get("search");

    const {
        data,
        isPending,
        isFetching,
        isFetchingNextPage,
        isFetchNextPageError,
        hasNextPage,
        fetchNextPage,
        error,
    } = useInfiniteProducts({
        sort,
        categoryId,
        search,
        pageSize: PAGE_SIZE,
        onDeal: deals ? true : undefined,
        newArrivals: newArrivals ? true : undefined,
        bestSellers: bestSellers ? true : undefined,
    });

    // all loaded pages in one list. New products can shift the pages, so repeats are dropped.
    const products = useMemo(() => {
        const seen = new Set();
        return (data?.pages ?? [])
            .flatMap((page) => page.products)
            .filter((product) => !seen.has(product.id) && seen.add(product.id));
    }, [data]);

    const totalResults = data?.pages[0]?.totalResults ?? 0;
    const initialError = error && !isFetchNextPageError; // the first load failed (not the next page)

    const sentinelRef = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });

    const title = categoryId
        ? products[0]?.categoryName ?? "Category"
        : deals
            ? "Deals"
            : newArrivals
                ? "New Arrivals"
                : bestSellers
                    ? "Best Sellers"
                    : sortTitle[sort?.toLowerCase()] ?? "All Products";

    const handleCategoryChange = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set("categoryId", value);
        else next.delete("categoryId");
        setSearchParams(next);
        window.scrollTo({ top: 0, behavior: "smooth" }); // a new filter starts from the top
    };

    return (
        <HomeLayout>
            {initialError && (
                <p role="alert" className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {getErrorMessage(error)}
                </p>
            )}

            <ProductSection
                title={title}
                subtitle={isFetching && !isFetchingNextPage ? "Loading…" : initialError ? null : `${totalResults} products`}
                products={products}
                isLoading={isPending}
                columns={5}
                hideWhenEmpty={false}
                className="mt-2"
                headerAction={
                    <CategoryFilter
                        categories={categories}
                        value={categoryId}
                        onChange={handleCategoryChange}
                        disabled={categoriesLoading}
                    />
                }
                emptyMessage={
                    initialError ? null : (
                        <div className="rounded-md border border-gray-300 bg-white p-10 text-center min-h-[60vh] flex items-center justify-center flex-col">
                            <p className="font-semibold text-heading">No products found.</p>
                            <p className="mt-1 text-sm text-neutral-500">Try a different category or search.</p>
                        </div>
                    )
                }
            />

            {/* the invisible marker that triggers the next page */}
            <div ref={sentinelRef} aria-hidden="true" className="h-px" />

            {/* bottom of the list */}
            <div className="my-8 flex min-h-10 items-center justify-center">
                {isFetchingNextPage && (
                    <div role="status" className="flex items-center gap-2 text-sm text-neutral-500">
                        <span className="size-5 animate-spin rounded-full border-2 border-gray-300 border-t-accent-100" />
                        Loading more…
                    </div>
                )}

                {isFetchNextPageError && !isFetchingNextPage && (
                    <div role="alert" className="flex items-center gap-3 text-sm text-red-600">
                        {getErrorMessage(error)}
                        <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            className="rounded-md border border-gray-300 px-4 py-2 font-semibold text-heading hover:bg-gray-50"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isPending && !initialError && !hasNextPage && products.length > 0 && (
                    <p className="text-sm text-neutral-500">You've reached the end</p>
                )}
            </div>
        </HomeLayout>
    );
};

export default ProductsPage;