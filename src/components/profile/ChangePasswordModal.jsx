import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { extractFieldErrors, getErrorMessage } from "../../api/client";
import { useChangePassword } from "../../queries/users";
import FormField from "../form/FormField";
import { FormModal } from "../ui/AppModal";

function validate(v) {
    const errors = {};
    if (!v.currentPassword) errors.currentPassword = "Enter your current password.";
    if (v.newPassword.length < 8 || !/\d/.test(v.newPassword)) {
        errors.newPassword = "Use at least 8 characters, including a number.";
    } else if (v.newPassword === v.currentPassword) {
        errors.newPassword = "Choose a password different from the current one.";
    }
    if (v.confirmPassword !== v.newPassword) errors.confirmPassword = "Passwords do not match.";
    return errors;
}

export default function ChangePasswordModal({ onClose }) {
    const bodyRef = useRef(null);
    const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [show, setShow] = useState(false);

    const mutation = useChangePassword();
    const saving = mutation.isPending;

    useEffect(() => {
        bodyRef.current?.querySelector("input")?.focus();
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
        <FormModal
            isOpen
            onClose={onClose}
            onSubmit={handleSubmit}
            icon={KeyRound}
            title="Change password"
            description="Use a strong password you don't use anywhere else."
            submitLabel="Update password"
            pendingLabel="Updating…"
            isPending={saving}
            size="md"
        >
            <div ref={bodyRef} className="space-y-4">
                {formError && (
                    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                        {formError}
                    </p>
                )}

                <FormField
                    label="Current password"
                    id="currentPassword"
                    type={type}
                    autoComplete="current-password"
                    value={values.currentPassword}
                    onChange={handleChange}
                    error={errors.currentPassword}
                />
                <FormField
                    label="New password"
                    id="newPassword"
                    type={type}
                    autoComplete="new-password"
                    value={values.newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                />
                <p className="-mt-2 text-xs text-neutral-500">At least 8 characters, including a number.</p>
                <FormField
                    label="Confirm new password"
                    id="confirmPassword"
                    type={type}
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                />

                <label className="flex items-center gap-2 text-sm text-heading">
                    <input
                        type="checkbox"
                        checked={show}
                        onChange={(e) => setShow(e.target.checked)}
                        className="size-4 accent-accent-100"
                    />
                    Show passwords
                </label>
            </div>
        </FormModal>
    );
}