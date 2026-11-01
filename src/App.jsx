import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register"
import Cart from "./pages/customer/Cart";
import { Suspense, lazy } from "react";
import PageLoader from "./components/PageLoader";
import { AdminRoute, GuestRoute, ProtectedRoute } from "./components/RouteGuard";
import NotFound from "./pages/NotFound";
import Profile from "./pages/customer/Profile";
import ProductPage from "./pages/products/ProductPage";
import ProductsPage from "./pages/products/ProductsPage";
import ScrollToTop from "./components/ScrollToTop";
import AdminProductPage from "./pages/admin/Products";
import AdminProductFormPage from "./pages/admin/AdminProductForm";
import Orders from "./pages/admin/Orders";
import Deals from "./pages/admin/Deals";
import Category from "./pages/admin/Category";
import Inventory from "./pages/admin/Inventory";
import Customers from "./pages/admin/Customers";
import Reports from "./pages/admin/Reports";
import AdminProfile from "./pages/admin/Profile";
import Checkout from "./pages/customer/Checkout";
import OrderDetails from "./pages/customer/OrderDetails";
import AdminOrderDetails from "./pages/admin/OrderDetails";
import Reviews from "./pages/admin/Reviews";

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<Cart />} />

          {/* Guest only page */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Auth required */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
          </Route>

          {/* Admin role required */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />

              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<AdminOrderDetails />} />

              <Route path="deals" element={<Deals />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="products" element={<AdminProductPage />} />
              <Route path="products/new" element={<AdminProductFormPage />} />
              <Route path="products/:id/edit" element={<AdminProductFormPage />} />

              <Route path="categories" element={<Category />} />
              <Route path="inventory" element={<Inventory />} />

              <Route path="customers" element={<Customers />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
