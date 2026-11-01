import { useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { PageHeader } from "../../components/admin/ui";
import DiscountsTab from "./deals/DiscountsTab";
import VouchersTab from "./deals/VouchersTab";
import { focusRing } from "./deals/shared";

const TABS = [["discounts", "Discounts"], ["vouchers", "Vouchers"]];

export default function Deals() {
    useDocumentTitle("Deals & Promotions");
    const [tab, setTab] = useState("discounts");

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Deals & Promotions"
                subtitle="Discount products for a set time, and create voucher codes shoppers can use at checkout."
            />

            <div role="group" aria-label="Promotion type" className="flex gap-1 border-b border-gray-300">
                {TABS.map(([id, label]) => (
                    <button
                        key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${focusRing} ${tab === id
                            ? "border-accent-100 text-neutral-900"
                            : "border-transparent text-neutral-500 hover:text-neutral-900"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === "discounts" ? <DiscountsTab /> : <VouchersTab />}
        </div>
    );
}