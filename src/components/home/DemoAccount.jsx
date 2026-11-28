import { useState } from "react";
import { Copy, Check, UserRound, ShieldCheck } from "lucide-react";

const accounts = [
    {
        role: "Customer",
        username: "qc.test",
        password: "qwerty123",
        icon: UserRound,
    },
    {
        role: "Admin",
        username: "adminqq",
        password: "qwerty123",
        icon: ShieldCheck,
    },
];

const DemoAccount = () => {
    const [copied, setCopied] = useState("");

    const copyLogin = async (account) => {
        await navigator.clipboard.writeText(
            `Username: ${account.username}\nPassword: ${account.password}`
        );

        setCopied(account.role);

        setTimeout(() => setCopied(""), 2000);
    };

    return (
        <div className="w-full border border-gray-300 rounded-md mt-4 bg-white grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-300">
            {accounts.map((account) => {
                const Icon = account.icon;
                const isCopied = copied === account.role;

                return (
                    <div
                        key={account.role}
                        className="flex items-center gap-4 p-5"
                    >
                        {/* Icon */}
                        <div className="p-3 rounded-lg bg-orange-50 text-[#ff5e1f] shrink-0">
                            <Icon className="w-6 h-6" />
                        </div>

                        {/* Account info */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-neutral-900 text-sm sm:text-base">
                                    {account.role}
                                </h4>

                                <span className="text-xs text-neutral-400">
                                    Demo Account
                                </span>
                            </div>

                            <p className="text-xs sm:text-sm text-neutral-500 mt-1 truncate">
                                Username: {account.username} · Password: {account.password}
                            </p>
                        </div>

                        {/* Copy button */}
                        <button
                            type="button"
                            onClick={() => copyLogin(account)}
                            className="flex items-center gap-1.5 shrink-0 rounded-md bg-[#ff5e1f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#e9551b]"
                        >
                            {isCopied ? (
                                <>
                                    <Check size={14} />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy size={14} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default DemoAccount;