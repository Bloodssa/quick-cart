import { Card, Pill } from "../ui";

export default function ProfileHeader({ name, email }) {
    const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    return (
        <Card className="flex items-center gap-4 p-6">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent-50 text-xl font-extrabold text-accent-300" aria-hidden="true">
                {initials}
            </div>
            <div className="min-w-0">
                <p className="truncate text-lg font-bold">{name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <Pill tone="orange">Administrator</Pill>
                    <span className="truncate">{email}</span>
                </div>
            </div>
        </Card>
    );
}