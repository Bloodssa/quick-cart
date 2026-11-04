import { Link } from "react-router-dom";
import electronicImage from "../../assets/images/category/electronic.jpg";
import gadgetImage from "../../assets/images/category/gadgets.jpg";
import homeImage from "../../assets/images/category/home.jpg";
import apparelImage from "../../assets/images/category/apparel.jpg";
import personalImage from "../../assets/images/category/personal.jpg";
import sportsImage from "../../assets/images/category/sports.jpg";
import construction from "../../assets/images/category/const.png"
import groceryImage from "../../assets/images/category/grocery.jpg";
import toysImage from "../../assets/images/category/toys.jpg";
import booksImage from "../../assets/images/category/books.jpg";

const categories = [
    { id: 8, name: "Electronics & Gadgets", image: electronicImage },
    { id: 9, name: "Mobiles & Tablets", image: gadgetImage },
    { id: 10, name: "Home & Living", image: homeImage },
    { id: 11, name: "Fashion & Apparel", image: apparelImage },
    { id: 12, name: "Beauty & Personal Care", image: personalImage },
    { id: 13, name: "Sports & Fitness", image: sportsImage },
    { id: 18, name: "Home Construction & Hardware", image: construction },
    { id: 15, name: "Groceries & Essentials", image: groceryImage },
    { id: 16, name: "Toys, Kids & Baby", image: toysImage },
    { id: 17, name: "Books & Stationery", image: booksImage },
];

export default function CategoryGrid() {
    return (
        <section className="mt-13">
            <h1 className="text-3xl font-bold">Shop by Category</h1>
            <p className="mt-1 text-base text-neutral-500">Browse our top categories</p>

            <div className="mt-4 overflow-hidden rounded-md border border-gray-300 bg-white">
                <div className="category-grid -mr-px -mb-px grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            to={`/products?categoryId=${category.id}`}
                            className="group flex cursor-pointer flex-col items-center justify-center bg-white p-4 text-center transition-colors hover:bg-gray-50 sm:p-6"
                        >
                            <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-neutral-100 transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20">
                                <img src={category.image} alt="" className="h-full w-full object-cover" />
                            </div>
                            <span className="text-sm font-semibold text-neutral-800 transition-colors group-hover:text-accent-100 sm:text-base">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}