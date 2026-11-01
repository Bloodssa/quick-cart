import { Link } from "react-router-dom";
import { Store, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import SidebarLink from "./AdminSidebarLink";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Layers,
    Boxes,
    Users,
    Percent,
    TrendingUp,
    UserRound,
    Star
} from "lucide-react";

// side bar links
const sidebarSections = [
    {
        title: "Store Management",
        items: [
            { name: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
            { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
            { name: "Deals & Promotions", path: "/admin/deals", icon: Percent },
            { name: "Reviews", path: "/admin/reviews", icon: Star },
        ],
    },
    {
        title: "Catalog",
        items: [
            { name: "Products", path: "/admin/products", icon: Package },
            { name: "Categories", path: "/admin/categories", icon: Layers },
            { name: "Inventory", path: "/admin/inventory", icon: Boxes },
        ],
    },
    {
        title: "Customers",
        items: [
            { name: "Customers", path: "/admin/customers", icon: Users },
            { name: "Sales Reports", path: "/admin/reports", icon: TrendingUp },
        ],
    },
    {
        title: "Settings",
        items: [
            { name: "Profile", path: "/admin/profile", icon: UserRound },
        ],
    }
];

const Sidebar = ({
    isOpen = false,
    onClose = () => { },
    onNavigate = () => { }
}) => {
    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    return (
        <>
            {/* Mobile overlay */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />

            <aside className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-gray-300 bg-white transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="sticky top-0 z-10 flex h-19 shrink-0 items-center justify-between border-b border-gray-300 bg-white px-6">
                    <Link to="/admin" className="font-sans text-2xl font-extrabold text-neutral-900">
                        <span className="text-accent-300">Quick</span>Cart
                    </Link>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sidebar"
                        className="rounded-md border border-gray-300 p-2 transition duration-200 hover:bg-gray-100 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav */}
                <div className="flex flex-1 flex-col overflow-y-auto">
                    <nav className="px-4 py-6">
                        {sidebarSections.map((section, sectionIndex) => {
                            const items = section.items.filter((item) => !item.adminOnly || isAdmin);
                            if (items.length === 0) return null;

                            return (
                                <div key={section.title}>
                                    {sectionIndex > 0 && <hr className="my-3 border-gray-300" />}

                                    <h3 className="mb-3 ml-2 text-[15px] font-semibold text-neutral-900">
                                        {section.title}
                                    </h3>

                                    <ul className="flex flex-col gap-1">
                                        {items.map((item) => (
                                            <li key={item.path}>
                                                <SidebarLink item={item} onNavigate={onNavigate} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-gray-300 p-4">
                    <Link
                        to="/"
                        onClick={onNavigate}
                        className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-gray-100 hover:text-neutral-900"
                    >
                        <Store className="h-5 w-5 shrink-0 text-neutral-500 group-hover:text-neutral-900" />
                        Back to store
                    </Link>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;