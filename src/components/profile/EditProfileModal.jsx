import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { extractFieldErrors, getErrorMessage } from "../../api/client";
import { useUpdateProfile } from "../../queries/users";
import FormField from "../form/FormField";
import { FormModal } from "../ui/AppModal";

function validate(v) {
    const errors = {};
    if (v.fullName.length < 2) errors.fullName = "Enter your full name.";
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(v.username)) {
        errors.username = "Use 3-30 letters, numbers or underscores.";
    }
    if (!/^\S+@\S+\.\S+$/.test(v.email)) errors.email = "Enter a valid email address.";
    return errors;
}

export default function EditProfileModal({ user, onClose }) {
    const bodyRef = useRef(null);
    const [values, setValues] = useState({
        fullName: user?.fullName ?? "",
        username: user?.username ?? "",
        email: user?.email ?? "",
    });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");

    const mutation = useUpdateProfile();
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

        const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
        const found = validate(payload);
        setErrors(found);
        setFormError("");
        if (Object.keys(found).length > 0) return;

        mutation.mutate(payload, {
            onSuccess: () => {
                toast.success("Profile updated");
                onClose();
            },
            onError: (err) => {
                const fields = extractFieldErrors(err);
                if (Object.keys(fields).length > 0) setErrors(fields);
                else setFormError(getErrorMessage(err));
            },
        });
    }

    return (
        <FormModal
            isOpen
            onClose={onClose}
            onSubmit={handleSubmit}
            icon={Pencil}
            title="Edit profile"
            description="Update your name, username and email."
            submitLabel="Save changes"
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
                    label="Full name"
                    id="fullName"
                    value={values.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.fullName)}
                />
                <FormField
                    label="Username"
                    id="username"
                    value={values.username}
                    onChange={handleChange}
                    error={errors.username}
                    autoComplete="username"
                    aria-invalid={Boolean(errors.username)}
                />
                <FormField
                    label="Email"
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    error={errors.email}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                />
            </div>
        </FormModal>
    );
}