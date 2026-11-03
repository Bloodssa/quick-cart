import { Trash2 } from "lucide-react";
import { ConfirmModal } from "./ui/AppModal";

export default function ConfirmDeleteModal({
    title = "Delete this item?",
    message = "This action cannot be undone.",
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    loading = false,
    onConfirm,
    onClose,
}) {
    return (
        <ConfirmModal
            isOpen
            destructive
            icon={Trash2}
            title={title}
            message={message}
            confirmLabel={confirmLabel}
            pendingLabel="Deleting…"
            cancelLabel={cancelLabel}
            isPending={loading}
            onConfirm={onConfirm}
            onClose={onClose}
        />
    );
}