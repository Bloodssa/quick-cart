import { Link, useParams } from "react-router-dom";
import { getErrorMessage } from "../../api/client";
import ProductGallery from "../../components/products/ProductGallery";
import ProductInfo from "../../components/products/ProductInfo";
import Skeleton from "../../components/ui/Skeleton";
import HomeLayout from "../../layouts/HomeLayout";
import { useProduct } from "../../queries/products";
import RelatedProducts from "../../components/products/RelatedProducts";
import ReviewsSection from "../../components/reviews/ReviewsSection";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export default function ProductPage() {
    const { id } = useParams();
    const { data: product, isPending, error } = useProduct(id);
    useDocumentTitle(product?.name ?? "Product");

    if (isPending) {
        return (
            <HomeLayout>
                <div role="status" className="grid gap-8 md:grid-cols-2">
                    <span className="sr-only">Loading product…</span>
                    <Skeleton className="aspect-square" />
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </HomeLayout>
        );
    }

    if (error || !product) {
        return (
            <HomeLayout>
                <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                    {error ? getErrorMessage(error) : "Product not found."}{" "}
                    <Link to="/products" className="font-semibold underline">
                        Back to products
                    </Link>
                </div>
            </HomeLayout>
        );
    }

    return (
        <HomeLayout>
            <div className="mt-6 grid items-start gap-8 md:grid-cols-2 lg:gap-12">
                <ProductGallery key={`gallery-${product.id}`} images={product.images} name={product.name} />
                <ProductInfo key={`info-${product.id}`} {...product} />
            </div>

            <ReviewsSection key={`reviews-${product.id}`} productId={product.id} />

            <RelatedProducts
                title="You may also like"
                params={{ categoryId: product.categoryId }}
                excludeIds={[product.id]}
            />
        </HomeLayout>
    );
};