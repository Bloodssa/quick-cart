import { Card } from "../ui";
import { formatDate } from "../../../lib/format";

function Field({ label, children }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-gray-600">{label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold">{children || "—"}</dd>
        </div>
    );
}

export default function AccountDetails({ name, email, createdAt }) {
    return (
        <Card className="p-6">
            <h2 className="mb-4 text-base font-bold">Account details</h2>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name">{name}</Field>
                <Field label="Email address">{email}</Field>
                <Field label="Role">Administrator</Field>
                <Field label="Member since">{createdAt && formatDate(createdAt)}</Field>
            </dl>
        </Card>
    );
}