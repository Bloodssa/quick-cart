import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Card, secondaryBtn } from "../ui";
import ChangePasswordModal from "./ChangePasswordModal";

export default function SecuritySection() {
    const [open, setOpen] = useState(false);

    return (
        <Card className="p-6">
            <h2 className="mb-4 text-base font-bold">Security</h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold">Password</p>
                    <p className="text-sm text-gray-600">Use a strong password you don't use anywhere else.</p>
                </div>
                <button type="button" onClick={() => setOpen(true)} className={secondaryBtn}>
                    <KeyRound size={16} className="mr-2" aria-hidden="true" />
                    Change password
                </button>
            </div>

            {open && <ChangePasswordModal onClose={() => setOpen(false)} />}
        </Card>
    );
}