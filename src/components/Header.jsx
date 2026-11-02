import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { UserRound, Menu, X, CircleUserRound, ArrowLeft } from "lucide-react";
import SearchInput from "./SearchInput";
import { useDebouncedValue } from "../hooks/useDebounce";
import { useAuth } from "../hooks/useAuth";
import { LogOut } from "lucide-react";
import CartLink from "./cart/CartLink";

const navLinks = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: "Deals", path: "/products?deals=true" },
    { name: "New Arrivals", path: "/products?newArrivals=true&sort=newest" },
    { name: "Best Sellers", path: "/products?bestSellers=true&sort=popular" },
];

const getActivePath = (pathname, search) => {
    const current = new URLSearchParams(search);
    let bestPath = null;
    let bestScore = -1;

    for (const link of navLinks) {
        const [linkPathname, linkQuery = ""] = link.path.split("?");
        if (linkPathname !== pathname) continue;

        const required = [...new URLSearchParams(linkQuery)];
        const matches = required.every(([key, value]) => current.get(key) === value);
        if (!matches) continue;

        if (required.length > bestScore) {
            bestPath = link.path;
            bestScore = required.length;
        }
    }

    return bestPath;
};

const Header = ({ subhead }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isOpenProfile, setProfileOpen] = useState(false);
    const { user, status, logout } = useAuth();
    const isLoading = status === "loading";
    const isLoggedIn = status === "authenticated" && Boolean(user);
    const navigate = useNavigate();
    const location = useLocation();
    const profileRef = useRef(null);

    const activePath = getActivePath(location.pathname, location.search);
    const isLinkActive = (path) => path === activePath;

    const urlSearch = new URLSearchParams(location.search).get("search") ?? "";
    const [searchTerm, setSearchTerm] = useState(urlSearch);
    const debouncedTerm = useDebouncedValue(searchTerm.trim(), 400);
    const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);
    if (urlSearch !== lastUrlSearch) {
        setLastUrlSearch(urlSearch);
        if (urlSearch !== debouncedTerm) setSearchTerm(urlSearch);
    }

    useEffect(() => {
        if (debouncedTerm === urlSearch) return;

        const onProducts = location.pathname === "/products";
        if (!debouncedTerm && !onProducts) return; // don't leave other pages when the box is empty

        navigate(
            debouncedTerm ? `/products?search=${encodeURIComponent(debouncedTerm)}` : "/products",
            { replace: onProducts }
        );

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedTerm]);

    useEffect(() => {
        if (!isOpenProfile) return; // only listen while the menu is open

        function handlePointerDown(e) {
            // the click is outside if the wrapper exists and doesn't contain what was clicked
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        }

        function handleKeyDown(e) {
            if (e.key === "Escape") setProfileOpen(false);
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        // remove the listeners when the menu closes or the component unmounts
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpenProfile]);

    const handleSearch = (value) => {
        const term = value.trim();
        navigate(term ? `/products?search=${encodeURIComponent(term)}` : "/products");
        setMenuOpen(false);
    }

    const handleLogout = async () => {
        setProfileOpen(false);
        setMenuOpen(false);

        try {
            await logout();
            navigate("/", { replace: true });
        } catch (err) {
            console.error("Log out failed", err);
        }
    }

    return (
        <>
            <header className="relative z-50 w-full border-b border-gray-300 bg-white">
                <div className="container mx-auto flex items-center justify-between px-4 py-2 md:px-8 md:py-4">
                    <div className="flex-4 flex gap-10 items-center">
                        <Link to="/" className="font-sans font-extrabold text-lg md:text-2xl text-neutral-900 shrink-0"><span className="text-accent-300">Quick</span>Cart</Link>

                        {/* Desktop Input serach */}
                        <SearchInput
                            className="hidden md:block w-full mr-15"
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onSubmit={handleSearch}
                            placeholder="Search products, brands and more..."
                            label="Search products"
                        />
                    </div>
                    <div className="hidden md:flex items-center gap-1 shrink-0">
                        {status === "anonymous" && (
                            <Link to="/login" className="flex gap-2 px-4 py-2 items-center justify-between rounded-md border border-gray-300 hover:bg-accent-100 hover:text-white transition-colors duration-250 group">
                                <UserRound className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                                <span className="font-semibold text-sm">Log In</span>
                            </Link>
                        )}

                        {isLoggedIn && user?.role?.toLowerCase() === "admin" && (
                            <Link
                                to="/admin"
                                className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-gray-100"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Link>
                        )}
                        <CartLink />

                        {isLoggedIn && (
                            <div className="relative" ref={profileRef}>
                                <button
                                    type="button"
                                    onClick={() => setProfileOpen(!isOpenProfile)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-white font-bold uppercase hover:bg-accent-hover transition-colors"
                                    aria-label="Open profile menu"
                                    aria-expanded={isOpenProfile}
                                >
                                    {user.fullName?.[0] ?? "U"}
                                </button>
                                {isOpenProfile && (
                                    <div className="absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                        <div className="border-b border-gray-200 px-4 py-4">
                                            <p className="truncate font-semibold text-neutral-900">
                                                {user.fullName}
                                            </p>
                                        </div>

                                        <div className="p-2">
                                            <Link
                                                to="/profile"
                                                onClick={() => setProfileOpen(false)}
                                                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-gray-100"
                                            >
                                                <CircleUserRound className="h-5 w-5" />
                                                My Profile
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut className="h-5 w-5" />
                                                Log Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile menu */}
                    <div className="flex items-center gap-2 md:hidden">
                        <CartLink variant="mobile" />
                        <button
                            onClick={() => setMenuOpen(!isMenuOpen)}
                            className="p-2 text-black rounded-md hover:bg-gray-100 focus:outline-none"
                            aria-label="Toggle Navigation"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="absolute left-0 top-full z-50 w-full md:hidden border-b border-gray-300 px-4 pt-3 pb-5 space-y-4 bg-white">
                        {/* Mobile search */}
                        <SearchInput
                            className="w-full"
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onSubmit={handleSearch}
                            placeholder="Search products..."
                            label="Search products"
                        />


                        <nav className="flex flex-col space-y-2 pt-2 border-t border-gray-300 font-medium text-neutral-900">
                            {navLinks.map(link => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end
                                    onClick={() => setMenuOpen(!isMenuOpen)}
                                    className={
                                        isLinkActive(link.path)
                                            ? "py-1 font-bold text-accent-300 border-b-2 border-accent-300 -mb-px transition-colors"
                                            : "py-1 text-neutral-700 hover:text-accent-300 transition-colors"
                                    }
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                        </nav>


                        {!isLoading && (
                            <Link to={isLoggedIn ? "/profile" : "/login"} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md border border-gray-300 font-semibold text-sm hover:bg-accent-100 hover:text-white transition-colors">
                                <UserRound className="w-5 h-5" />
                                <span>{isLoggedIn ? "Profile" : "Log In"}</span>
                            </Link>
                        )}
                        {isLoggedIn && (
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                                <LogOut className="h-5 w-5" />
                                Log Out
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* Desktop sub nav */}
            {subhead && (
                <nav className="hidden md:block border-b border-gray-300">
                    <div className="container mx-auto flex items-center justify-center px-4 py-2 md:px-8 md:py-2 gap-10 font-normal">
                        {navLinks.map(link => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                end
                                className={
                                    isLinkActive(link.path)
                                        ? "py-1 font-bold text-accent-300 border-b-2 border-accent-300 -mb-px transition-colors"
                                        : "py-1 text-neutral-700 hover:text-accent-300 transition-colors"
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </div>
                </nav>
            )}
        </>
    );
}

export default Header;