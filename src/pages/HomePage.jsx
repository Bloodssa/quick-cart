import HomeLayout from "../layouts/HomeLayout";
import HeroSlider from "../components/home/HeroSlider";
import FeatureBar from "../components/home/FeatureBar";
import CategoryGrid from "../components/home/CategoryGrid"
import PromoBanner from "../components/home/PromoBanner";
import CollectionTiles from "../components/home/CollectionTiles";
import ProductShelf from "../components/products/ProductShelf";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const HomePage = () => {
    useDocumentTitle("Home");
    
    return (
        <HomeLayout>
            <HeroSlider />
            <FeatureBar />
            <CategoryGrid />

            {/* Featured Section */}
            <ProductShelf
                title="Featured Products"
                params={{ featured: true, page: 1, pageSize: 10 }}
                viewAllLink="/products?deals=true"
                columns={6}
            />

            <PromoBanner />

            {/* Trending Section */}
            <ProductShelf
                title="Trending Now"
                params={{ sort: "popular", page: 1, pageSize: 10 }}
                viewAllLink="/products?bestSellers=true&sort=popular"
                columns={5}
            />

            {/* Collections */}
            <CollectionTiles />

            {/* New Arrival Section */}
            <ProductShelf
                title="New Arrivals"
                params={{ sort: "newest", page: 1, pageSize: 8 }}
                viewAllLink="/products?newArrivals=true&sort=newest"
                columns={5}
            />
        </HomeLayout>
    );
};

export default HomePage;