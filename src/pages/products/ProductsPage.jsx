import { useSearchParams } from "react-router-dom";
import HomeLayout from "../../layouts/HomeLayout";
import ProductSection from "../../components/products/ProductSection";
import CategoryFilter from "../../components/CategoryFilter";
import { useCategories } from "../../queries/categories";
import { useProducts } from "../../queries/products";
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
    const page = Number(searchParams.get("page") ?? 1);

    const { data, isPending, isFetching, error } = useProducts({
        sort,
        categoryId,
        search,
        page,
        pageSize: PAGE_SIZE,
        onDeal: deals ? true : undefined,
        newArrivals: newArrivals ? true : undefined,
        bestSellers: bestSellers ? true : undefined,
    });

    const products = data?.products ?? [];
    const title = categoryId
        ? products[0]?.categoryName ?? "Category"
        : deals
            ? "Deals"
            : newArrivals
                ? "New Arrivals"
                : bestSellers
                    ? "Best Sellers"
                    : sortTitle[sort?.toLowerCase()] ?? "All Products";
    const totalPages = Math.ceil((data?.totalResults ?? 0) / PAGE_SIZE);

    const handleCategoryChange = (value) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set("categoryId", value);
        else next.delete("categoryId");
        next.delete("page");
        setSearchParams(next);
    }

    const goToPage = (p) => {
        const next = new URLSearchParams(searchParams);
        next.set("page", p);
        setSearchParams(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <HomeLayout>
            {error && (
                <p role="alert" className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                    {getErrorMessage(error)}
                </p>
            )}

            <ProductSection
                title={title}
                subtitle={isFetching ? "Loading…" : error ? null : `${data.totalResults} products`}
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
                    error ? null : (
                        <div className="rounded-md border border-gray-300 bg-white p-10 text-center min-h-[60vh] flex items-center justify-center flex-col">
                            <p className="font-semibold text-heading">No products found.</p>
                            <p className="mt-1 text-sm text-neutral-500">Try a different category or search.</p>
                        </div>
                    )
                }
            />

            {!isPending && !error && totalPages > 1 && (
                <div className="my-8 flex items-center justify-center gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => goToPage(page - 1)}
                        className="rounded-md border border-gray-300 px-4 py-2 disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-sm">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => goToPage(page + 1)}
                        className="rounded-md border border-gray-300 px-4 py-2 disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </HomeLayout>
    );
}

export default ProductsPage;