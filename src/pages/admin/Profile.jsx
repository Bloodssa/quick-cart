import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuth } from "../../hooks/useAuth";
import { PageHeader } from "../../components/admin/ui";
import ProfileHeader from "../../components/admin/profile/ProfileHeader";
import AccountDetails from "../../components/admin/profile/AccountDetails";
import SecuritySection from "../../components/admin/profile/SecuritySection";

// Your user object's name field isn't known, so try the usual ones in order
const displayName = (user) =>
    user?.fullName ?? user?.name ?? user?.username ?? user?.userName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(" ");

export default function Profile() {
    useDocumentTitle("Profile");
    const { user } = useAuth();

    const email = user?.email ?? "";
    const name = displayName(user) || email.split("@")[0];

    return (
        <div className="flex max-w-5xl flex-col gap-5">
            <PageHeader title="Profile" subtitle="Your administrator account." />
            <ProfileHeader name={name} email={email} />
            <AccountDetails name={name} email={email} createdAt={user?.createdAt} />
            <SecuritySection />
        </div>
    );
}