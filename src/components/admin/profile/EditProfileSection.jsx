import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, secondaryBtn } from "../ui";
import EditProfileModal from "../../../components/profile/EditProfileModal";

export default function EditProfileSection({ user }) {
    const [open, setOpen] = useState(false);

    return (
        <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold">Account details</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Update your administrator account information.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={secondaryBtn}
                >
                    <Pencil size={16} className="mr-2" />
                    Edit profile
                </button>
            </div>

            {open && (
                <EditProfileModal
                    user={user}
                    onClose={() => setOpen(false)}
                />
            )}
        </Card>
    );
}