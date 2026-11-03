import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, ChevronDown, CircleUserRound, LogOut, Store } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const AdminHeader = ({
    isSidebarOpen,
    isLargeScreen,
    onToggleSidebar
}) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // close the dropdown when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        try {
            await logout();
            navigate("/", { replace: true });
        } catch (err) {
            console.error("Log out failed", err);
        }
    };

    const role = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "";

    return (
        <header className={`fixed right-0 top-0 z-30 flex h-19 items-center justify-between border-b border-gray-300 bg-white px-4 transition-all duration-300 ease-in-out md:px-8 ${isLargeScreen && isSidebarOpen ? "left-60" : "left-0"}`}>
            {/* Sidebar toggle */}
            <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Toggle sidebar"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-gray-300 transition-colors hover:bg-gray-50"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-expanded={dropdownOpen}
                    className="flex cursor-pointer items-center gap-2 text-black"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 font-bold uppercase text-white">
                        {user?.fullName?.[0] ?? "U"}
                    </span>
                    <span className="mr-1 hidden font-semibold sm:block">{role}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-4 flex w-64 flex-col rounded-md border border-gray-300 bg-white p-2">
                        <div className="px-3 py-2">
                            <span className="block truncate font-medium text-black">
                                {user?.fullName}
                            </span>
                            <span className="block truncate text-sm text-gray-500">
                                {user?.email}
                            </span>
                        </div>

                        <ul className="mt-1 flex flex-col border-t border-gray-200 pt-2">
                            <Link
                                to="/"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-black hover:bg-gray-100"
                            >
                                <Store className="h-5 w-5" />
                                Back to store
                            </Link>
                            <li>
                                <Link
                                    to="/admin/profile"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-black hover:bg-gray-100"
                                >
                                    <CircleUserRound className="h-5 w-5" />
                                    Edit Profile
                                </Link>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Sign Out
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </header>
    );
};

export default AdminHeader;