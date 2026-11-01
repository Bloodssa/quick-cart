import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { extractFieldErrors, getErrorMessage } from "../../../api/client";
import { useChangePassword } from "../../../queries/users";
import FormField from "../../form/FormField";
import { primaryBtn, secondaryBtn } from "../ui";

function validate(v) {
    const errors = {};
    if (!v.currentPassword) errors.currentPassword = "Enter your current password.";
    if (v.newPassword.length < 8 || !/\d/.test(v.newPassword)) errors.newPassword = "Use at least 8 characters, including a number.";
    else if (v.newPassword === v.currentPassword) errors.newPassword = "Choose a password different from the current one.";
    if (v.confirmPassword !== v.newPassword) errors.confirmPassword = "Passwords do not match.";
    return errors;
}

export default function ChangePasswordModal({ onClose }) {
    const dialogRef = useRef(null);
    const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [show, setShow] = useState(false);
    const mutation = useChangePassword();
    const saving = mutation.isPending;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog.open) dialog.showModal();
        dialog.querySelector("input")?.focus();
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setValues((c) => ({ ...c, [name]: value }));
        setErrors((c) => ({ ...c, [name]: undefined }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const found = validate(values);
        setErrors(found);
        setFormError("");
        if (Object.keys(found).length > 0) return;

        mutation.mutate(values, {
            onSuccess: () => {
                toast.success("Password updated");
                onClose();
            },
            onError: (err) => {
                const fields = extractFieldErrors(err);
                if (Object.keys(fields).length > 0) setErrors(fields);
                else setFormError(getErrorMessage(err));
            },
        });
    }

    const type = show ? "text" : "password";

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onCancel={(e) => { if (saving) e.preventDefault(); }}
            onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
            aria-labelledby="pw-modal-title"
            className="m-auto w-[calc(100%-1rem)] max-w-md rounded-md border border-gray-300 bg-white p-0 text-neutral-900 backdrop:bg-black/40"
        >
            <div className="flex items-center justify-between border-b border-gray-300 px-5 py-4">
                <h2 id="pw-modal-title" className="text-lg font-bold">Change password</h2>
                <button type="button" onClick={onClose} disabled={saving} aria-label="Close"
                    className="rounded-md p-1 text-neutral-500 hover:bg-gray-100 hover:text-neutral-900 disabled:opacity-50">
                    <X size={20} aria-hidden="true" />
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4 px-5 py-5">
                    {formError && (
                        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
                    )}

                    <FormField label="Current password" id="currentPassword" type={type} autoComplete="current-password"
                        value={values.currentPassword} onChange={handleChange} error={errors.currentPassword} />
                    <FormField label="New password" id="newPassword" type={type} autoComplete="new-password"
                        value={values.newPassword} onChange={handleChange} error={errors.newPassword} />
                    <p className="-mt-2 text-xs text-gray-600">At least 8 characters, including a number.</p>
                    <FormField label="Confirm new password" id="confirmPassword" type={type} autoComplete="new-password"
                        value={values.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />

                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4 accent-accent-100" />
                        Show passwords
                    </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-300 px-5 py-4">
                    <button type="button" onClick={onClose} disabled={saving} className={secondaryBtn}>Cancel</button>
                    <button type="submit" disabled={saving} className={primaryBtn}>{saving ? "Updating…" : "Update password"}</button>
                </div>
            </form>
        </dialog>
    );
}