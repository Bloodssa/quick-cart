import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ConfirmModal, FormModal } from "../../components/ui/AppModal";
import { Card, EmptyState, ErrorState, PageHeader, TableSkeleton, Th, inputCls, primaryBtn, smallBtn, tdCls } from "../../components/admin/ui";
import { useCategories, useDeleteCategory, useSaveCategory } from "../../queries/categories";

function CategoryModal({ category, onClose }) {
    const bodyRef = useRef(null);
    const [name, setName] = useState(category.name ?? "");
    const [formError, setFormError] = useState("");
    const save = useSaveCategory();
    const isEdit = !!category.id;

    useEffect(() => {
        bodyRef.current?.querySelector("input")?.focus();
    }, []);

    function submit(e) {
        e.preventDefault();
        setFormError("");

        const trimmed = name.trim();
        if (trimmed.length < 2) {
            setFormError("Category name must be at least 2 characters.");
            return;
        }

        save.mutate(
            { id: category.id, name: trimmed },
            {
                onSuccess: () => {
                    toast.success(isEdit ? "Category updated" : "Category added");
                    onClose(); // only a successful save closes the modal
                },
                onError: (err) => setFormError(getErrorMessage(err)),
            }
        );
    }

    return (
        <FormModal
            isOpen
            onClose={onClose}
            onSubmit={submit}
            icon={isEdit ? Pencil : Plus}
            title={isEdit ? "Edit category" : "New category"}
            submitLabel="Save"
            isPending={save.isPending}
            size="sm"
        >
            <div ref={bodyRef} className="space-y-4">
                {formError && (
                    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                        {formError}
                    </p>
                )}

                <div>
                    <label htmlFor="cat-name" className="text-sm font-semibold text-heading">Name</label>
                    <input
                        id="cat-name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setFormError("");
                        }}
                        maxLength={60}
                        className={`${inputCls} mt-1.5`}
                    />
                </div>
            </div>
        </FormModal>
    );
}

export default function Categories() {
    useDocumentTitle("Categories");
    const [editing, setEditing] = useState(null); // null | {} (new) | category
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, isPending, isError, refetch } = useCategories();
    const del = useDeleteCategory();
    const items = data ?? [];

    function confirmDelete() {
        if (!deleteTarget) return;
        const { id, name } = deleteTarget;

        del.mutate(id, {
            onSuccess: () => {
                setDeleteTarget(null);
                toast.success(`${name} deleted`);
            },
            onError: (err) => {
                setDeleteTarget(null);
                toast.error(getErrorMessage(err));
            },
        });
    }

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title="Categories"
                subtitle="Organize the catalog. A category with products cannot be deleted."
                action={
                    <button type="button" onClick={() => setEditing({})} className={primaryBtn}>
                        <Plus size={16} className="mr-1.5" aria-hidden="true" /> Add category
                    </button>
                }
            />

            <Card className="min-w-0 overflow-hidden">
                {isPending ? <TableSkeleton /> : isError ? <ErrorState onRetry={refetch} /> : items.length === 0 ? (
                    <EmptyState title="No categories yet" message="Create your first category to organize products." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-120 border-collapse">
                            <thead><tr><Th>Name</Th><Th>Products</Th><Th align="right">Actions</Th></tr></thead>
                            <tbody>
                                {items.map((c) => (
                                    <tr key={c.id}>
                                        <td className={`${tdCls} font-semibold`}>{c.name}</td>
                                        <td className={tdCls}>{c.productCount ?? "–"}</td>
                                        <td className={`${tdCls} text-right`}>
                                            <div className="flex justify-end gap-2">
                                                <button type="button" className={smallBtn} onClick={() => setEditing(c)}>Edit</button>
                                                <button type="button" className={`${smallBtn} text-red-600`} disabled={c.productCount > 0}
                                                    title={c.productCount > 0 ? "Move or delete its products first" : undefined}
                                                    onClick={() => setDeleteTarget(c)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add / edit category */}
            {editing && (
                <CategoryModal key={editing.id ?? "new"} category={editing} onClose={() => setEditing(null)} />
            )}

            {/* Delete category */}
            <ConfirmModal
                isOpen={Boolean(deleteTarget)}
                onClose={() => !del.isPending && setDeleteTarget(null)}
                onConfirm={confirmDelete}
                destructive
                icon={Trash2}
                title="Delete category?"
                message={
                    <>
                        <span className="font-semibold text-heading">{deleteTarget?.name}</span> will be
                        permanently removed. This can't be undone.
                    </>
                }
                confirmLabel="Delete"
                pendingLabel="Deleting…"
                isPending={del.isPending}
            />
        </div>
    );
}