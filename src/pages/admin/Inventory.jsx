import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { Card, EmptyState, ErrorState, PageHeader, Pagination, Pill, StatCard, TableSkeleton, Th, inputCls, smallBtn, tdCls } from "../../components/admin/ui";
import { useAdjustStock, useProducts, useStockSummary } from "../../queries/products";
import { useCategories } from "../../queries/categories";

const PAGE_SIZE = 10;
const LOW_STOCK = 10;
const FILTERS = [
    { value: "all", label: "All" },
    { value: "low", label: "Low stock" },
    { value: "out", label: "Out of stock" },
];

function stockPill(stock) {
    if (stock <= 0) return <Pill tone="red">Out of stock</Pill>;
    if (stock <= LOW_STOCK) return <Pill tone="yellow">Low stock</Pill>;
    return <Pill tone="green">In stock</Pill>;
}

function AdjustCell({ product }) {
    const [delta, setDelta] = useState(0);
    const adjust = useAdjustStock();
    const canApply = delta !== 0 && product.stock + delta >= 0 && !adjust.isPending;

    return (
        <div className="flex items-center justify-end gap-1.5">
            <button type="button" className={smallBtn} aria-label={`Decrease ${product.name}`} onClick={() => setDelta((d) => d - 1)}><Minus size={14} aria-hidden="true" /></button>
            <input type="number" value={delta} onChange={(e) => setDelta(Number.parseInt(e.target.value, 10) || 0)}
                aria-label={`Stock change for ${product.name}`} className="h-9 w-16 rounded-md border border-gray-300 px-2 text-center text-sm" />
            <button type="button" className={smallBtn} aria-label={`Increase ${product.name}`} onClick={() => setDelta((d) => d + 1)}><Plus size={14} aria-hidden="true" /></button>
            <button type="button" disabled={!canApply}
                onClick={() => adjust.mutate({ id: product.id, delta }, { onSuccess: () => setDelta(0) })}
                className="inline-flex h-9 items-center rounded-md bg-accent-300 px-3 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50">
                {adjust.isPending ? "Saving…" : "Apply"}
            </button>
        </div>
    );
}

export default function Inventory() {
    useDocumentTitle("Inventory");
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");
    const [categoryId, setCategoryId] = useState("");
    const [page, setPage] = useState(1);

    const { data: categories = [], isLoading: categoriesLoading } = useCategories();

    // Loads the catalog once per category; search, stock filters and paging happen locally
    const { data, isPending, isError, refetch, isPlaceholderData } = useProducts({
        pageSize: 100,
        categoryId: categoryId || undefined,
    });

    const all = useMemo(
        () => (data?.products ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            categoryName: p.categoryName ?? p.category?.name ?? "",
            stock: p.stockQuantity,
        })),
        [data]
    );

    const { data: summary, isPending: summaryPending } = useStockSummary();

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        return all
            .filter((p) => !term || p.name.toLowerCase().includes(term))
            .filter((p) => filter === "low" ? p.stock > 0 && p.stock <= LOW_STOCK : filter === "out" ? p.stock <= 0 : true);
    }, [all, q, filter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const filtering = Boolean(q.trim() || filter !== "all" || categoryId);

    const handleCategoryChange = (event) => {
        setCategoryId(event.target.value);
        setPage(1); // a different filter starts from the first page
    };

    const clearFilters = () => {
        setQ("");
        setFilter("all");
        setCategoryId("");
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-5">
            <PageHeader title="Inventory" subtitle="Adjust stock by an amount so two admins never overwrite each other." />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Total units" value={summary?.totalUnits.toLocaleString()} loading={summaryPending} />
                <StatCard label={`Low stock (${LOW_STOCK} or fewer)`} value={summary?.lowCount} loading={summaryPending} />
                <StatCard label="Out of stock" value={summary?.outCount} loading={summaryPending} />
            </div>

            <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 p-4">
                    <div className="w-full sm:w-72">
                        <label htmlFor="inv-q" className="sr-only">Search products</label>
                        <input id="inv-q" type="search" placeholder="Search product" value={q}
                            onChange={(e) => { setQ(e.target.value); setPage(1); }}
                            className={`${inputCls} w-full`} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select value={categoryId} onChange={handleCategoryChange} disabled={categoriesLoading}
                            aria-label="Filter by category"
                            className="h-9 w-44 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-accent-300 focus:outline-none disabled:opacity-60">
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={String(c.id)}>{c.name}</option>
                            ))}
                        </select>
                        {FILTERS.map((f) => (
                            <button key={f.value} type="button" aria-pressed={filter === f.value}
                                onClick={() => { setFilter(f.value); setPage(1); }}
                                className={`h-9 rounded-full border px-4 text-xs font-semibold ${filter === f.value ? "border-accent-300 bg-accent-50 text-accent-300" : "border-gray-300 hover:bg-gray-50"}`}>
                                {f.label}
                            </button>
                        ))}
                        {filtering && (
                            <button type="button" onClick={clearFilters}
                                className="h-9 rounded-md bg-accent-300 px-4 text-xs font-semibold text-white hover:bg-accent-hover">
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
                {isPending ? <TableSkeleton /> : isError ? <ErrorState onRetry={refetch} /> : rows.length === 0 ? (
                    <EmptyState title="No products found" message="Try a different search or filter." />
                ) : (
                    <div className={`overflow-x-auto ${isPlaceholderData ? "opacity-60" : ""}`}>
                        <table className="w-full min-w-180 border-collapse">
                            <thead><tr><Th>Product</Th><Th>Category</Th><Th>In stock</Th><Th>Status</Th><Th align="right">Adjust stock</Th></tr></thead>
                            <tbody>
                                {rows.map((p) => (
                                    <tr key={p.id}>
                                        <td className={`${tdCls} font-semibold`}>
                                            <span className="line-clamp-1" title={p.name}>{p.name}</span>
                                        </td>
                                        <td className={`${tdCls} text-gray-600`}>{p.categoryName}</td>
                                        <td className={`${tdCls} font-bold`}>{p.stock}</td>
                                        <td className={tdCls}>{stockPill(p.stock)}</td>
                                        <td className={tdCls}><AdjustCell product={p} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
            </Card>
        </div>
    );
}