import { Link } from "react-router-dom";
import { DealBadge, PriceTag, DealEnds } from "../deals/PriceTag";
import { formatSold } from "../../lib/format";
import { Star } from "lucide-react";

const ProductCard = ({ product }) => {
    const { id, name, categoryName, stockQuantity, images, soldCount, averageRating, reviewCount } = product;
    const cover = images?.find((image) => image.isDefault) ?? images?.[0];
    const inStock = stockQuantity > 0;

    return (
        <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-gray-300 bg-white">
            <Link
                to={`/products/${id}`}
                className="flex min-w-0 flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-100"
            >
                <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
                    {cover ? (
                        <img
                            src={cover.imageUrl}
                            alt={name}
                            loading="lazy"
                            className={`h-full w-full object-contain p-2 ${inStock ? "" : "opacity-50"}`}
                        />
                    ) : (
                        <p className="text-sm text-neutral-500">No image available</p>
                    )}
                    <DealBadge product={product} />
                </div>

                <div className="flex flex-1 flex-col p-3 pt-1">
                    {categoryName && (
                        <span className="mb-1 w-fit max-w-full truncate rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                            {categoryName}
                        </span>
                    )}

                    <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-6 text-neutral-900">
                        {name}
                    </h3>

                    
                    {reviewCount > 0 && (
                        <p
                            className="mt-1 flex items-center gap-1 text-xs text-neutral-500"
                            title={`${averageRating.toFixed(1)} out of 5 from ${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`}
                        >
                            <Star size={13} aria-hidden="true" className="fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-neutral-900">{averageRating.toFixed(1)}</span>
                            <span>({formatSold(reviewCount)})</span>
                        </p>
                    )}

                    <PriceTag product={product} className="mt-2 text-base" />
                    <DealEnds product={product} />

                    <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs">
                        <span className={inStock ? "text-green-600" : "text-red-500"}>
                            {inStock ? "In Stock" : "Out of Stock"}
                        </span>
                        {soldCount > 0 && <span className="text-neutral-900">{formatSold(soldCount)} sold</span>}
                    </div>
                </div>
            </Link>
        </article>
    );
};

export default ProductCard;