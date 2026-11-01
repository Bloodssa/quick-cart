import { useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useDebouncedValue } from "../../hooks/useDebounce";
import { PageHeader } from "../../components/admin/ui";
import CustomerTable from "../../components/customers/CustomerTable";
import CustomerPanel from "../../components/customers/CustomerPanel";
import { useCustomers } from "../../queries/customers";

const PAGE_SIZE = 10;

export default function Customers() {
    useDocumentTitle("Customers");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);

    const term = useDebouncedValue(search.trim());
    const { data, isPending, isError, refetch } = useCustomers({ search: term || undefined, page, pageSize: PAGE_SIZE });

    const totalPages = Math.max(1, Math.ceil((data?.totalResults ?? 0) / PAGE_SIZE));

    function handleSearch(value) {
        setSearch(value);
        setPage(1);
    }

    return (
        <div className="flex flex-col gap-5">
            <PageHeader title="Customers" subtitle="Look up a customer and their order history. Read-only." />

            <div className="flex flex-wrap items-start gap-4">
                <CustomerTable
                    rows={data?.customers}
                    loading={isPending}
                    isError={isError}
                    onRetry={refetch}
                    search={search}
                    onSearch={handleSearch}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
                <CustomerPanel id={selectedId} />
            </div>
        </div>
    );
}