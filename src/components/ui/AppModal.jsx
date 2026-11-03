import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-100";

export const modalBtn = {
    primary: `h-10 rounded-md bg-accent-100 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
    secondary: `h-10 rounded-md border border-gray-300 bg-white px-5 text-sm font-semibold text-heading transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
    danger: `h-10 rounded-md bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
};

// const modal = useModal()  ->  { isOpen, open, close, toggle }
export function useModal(initialOpen = false) {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen((v) => !v), []);
    return { isOpen, open, close, toggle };
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

const TONES = {
    default: "bg-gray-100 text-neutral-600",
    accent: "bg-accent-50 text-accent-100",
    danger: "bg-red-50 text-red-600",
};

export default function AppModal({
    isOpen,
    onClose,
    title,
    description,
    icon: Icon,           
    variant = "default",
    children,
    footer,
    onSubmit,
    size = "md",
    dismissable = true,   
    hideClose = false,
    className = "",
}) {
    const ref = useRef(null);
    const titleId = useId();

    // open / close the native dialog
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;

        if (isOpen && !dialog.open) dialog.showModal();
        if (!isOpen && dialog.open) dialog.close();
    }, [isOpen]);

    // stop the page behind from scrolling
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    const Body = onSubmit ? "form" : "div";
    const bodyProps = onSubmit
        ? { onSubmit, noValidate: true, className: "flex min-h-0 flex-1 flex-col" }
        : { className: "flex min-h-0 flex-1 flex-col" };

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onCancel={(e) => {
                // Esc key
                e.preventDefault();
                if (dismissable) onClose?.();
            }}
            onClick={(e) => {
                // a click on the dialog itself (not its content) is a click on the backdrop
                if (e.target === e.currentTarget && dismissable) onClose?.();
            }}
            className={`m-auto max-h-[85vh] w-[calc(100%-2rem)] ${SIZES[size] ?? SIZES.md} rounded-md border border-gray-300 bg-white p-0 font-sans text-heading shadow-xl open:flex open:flex-col backdrop:bg-black/50 backdrop:backdrop-blur-sm ${className}`}
        >
            {isOpen && (
                <>
                    <div className="flex items-start justify-between gap-3 px-5 pt-5">
                        <div className="flex min-w-0 items-start gap-3">
                            {Icon && (
                                <span
                                    className={`flex size-10 shrink-0 items-center justify-center rounded-md ${TONES[variant] ?? TONES.default}`}
                                >
                                    <Icon size={20} aria-hidden="true" />
                                </span>
                            )}
                            <div className="min-w-0">
                                <h2 id={titleId} className="text-lg font-bold text-heading">{title}</h2>
                                {description && <p className="mt-0.5 text-sm text-neutral-500">{description}</p>}
                            </div>
                        </div>

                        {!hideClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className={`-mr-1 shrink-0 rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-gray-100 hover:text-heading ${focusRing}`}
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    <Body {...bodyProps}>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm text-neutral-600">
                            {children}
                        </div>

                        {footer && (
                            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-5 py-4">
                                {footer}
                            </div>
                        )}
                    </Body>
                </>
            )}
        </dialog>
    );
}

export function FormModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    icon,
    variant = "accent",
    submitLabel = "Save",
    pendingLabel = "Saving…",
    cancelLabel = "Cancel",
    isPending = false,
    size = "lg",
    children,
}) {
    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={onSubmit}
            title={title}
            description={description}
            icon={icon}
            variant={variant}
            size={size}
            dismissable={!isPending}
            hideClose={isPending}
            footer={
                <>
                    <button type="button" onClick={onClose} disabled={isPending} className={modalBtn.secondary}>
                        {cancelLabel}
                    </button>
                    <button type="submit" disabled={isPending} className={modalBtn.primary}>
                        {isPending ? pendingLabel : submitLabel}
                    </button>
                </>
            }
        >
            {children}
        </AppModal>
    );
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    icon,
    confirmLabel = "Confirm",
    pendingLabel = "Please wait…",
    cancelLabel = "Cancel",
    destructive = false,
    isPending = false,
}) {
    return (
        <AppModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            icon={icon}
            variant={destructive ? "danger" : "accent"}
            size="sm"
            dismissable={!isPending}
            hideClose={isPending}
            footer={
                <>
                    <button type="button" onClick={onClose} disabled={isPending} className={modalBtn.secondary}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className={destructive ? modalBtn.danger : modalBtn.primary}
                    >
                        {isPending ? pendingLabel : confirmLabel}
                    </button>
                </>
            }
        >
            {message}
        </AppModal>
    );
}