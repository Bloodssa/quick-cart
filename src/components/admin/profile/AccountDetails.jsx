
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, secondaryBtn } from "../ui";
import { formatDate } from "../../../lib/format";
import EditProfileModal from "../../../components/profile/EditProfileModal";
import { useAuth } from "../../../hooks/useAuth";

function Field({ label, children }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-gray-600">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold">
                {children || "—"}
            </dd>
        </div>
    );
}

export default function AccountDetails() {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    if (!user) return null;

    return (
        <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold">Account details</h2>

                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={secondaryBtn}
                >
                    <Pencil size={16} className="mr-2" />
                    Edit profile
                </button>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name">{user.fullName}</Field>
                <Field label="Email address">{user.email}</Field>
                <Field label="Role">Administrator</Field>
                <Field label="Member since">
                    {user.createdAt && formatDate(user.createdAt)}
                </Field>
            </dl>

            {open && (
                <EditProfileModal
                    user={user}
                    onClose={() => setOpen(false)}
                />
            )}
        </Card>
    );
}
