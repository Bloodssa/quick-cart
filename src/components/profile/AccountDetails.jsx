import { useState } from "react";
import { KeyRound, Pencil } from "lucide-react";
import { useAddresses } from "../../queries/addresses";
import { modalBtn } from "../ui/AppModal";
import Row from "./Row";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";

export default function AccountDetails({ label, user, onNavigate }) {
    const { data: addresses = [], isPending } = useAddresses();
    const [modal, setModal] = useState(null); // "profile" | "password" | null

    const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
    const closeModal = () => setModal(null);

    return (
        <section className="min-w-0 rounded-md bg-white p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
                <h2 id="account-section-title" className="text-xl font-bold text-heading">{label}</h2>
                <button type="button" onClick={() => setModal("profile")} className={`${modalBtn.secondary} inline-flex items-center gap-2`}>
                    <Pencil size={16} aria-hidden="true" />
                    Edit profile
                </button>
            </div>

            <div className="mt-4">
                <Row header="Full Name" details={user?.fullName} />
                <Row header="Username" details={user?.username} />
                <Row header="Email" details={user?.email} />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div>
                    <p className="text-sm text-neutral-900">Password</p>
                    <p className="text-xs text-neutral-500">Use a strong password you don't use anywhere else.</p>
                </div>
                <button type="button" onClick={() => setModal("password")} className={`${modalBtn.secondary} inline-flex items-center gap-2`}>
                    <KeyRound size={16} aria-hidden="true" />
                    Change password
                </button>
            </div>

            {/* Default address */}
            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:justify-between sm:gap-6">
                <div className="text-sm text-neutral-900">Default delivery address</div>
                <dd className="text-sm leading-6 sm:max-w-sm sm:text-right">
                    {defaultAddress ? (
                        <>
                            <p className="font-semibold text-neutral-900">{defaultAddress.recipientName}</p>
                            <p className="text-neutral-500">{defaultAddress.contactNumber}</p>
                            <p className="text-neutral-500">{defaultAddress.addressLine}</p>
                        </>
                    ) : (
                        <p className="text-neutral-500">No address saved yet.</p>
                    )}
                    {!isPending && (
                        <button
                            type="button"
                            onClick={() => onNavigate("address")}
                            className="mt-2 font-semibold text-accent-100 hover:text-accent-hover"
                        >
                            {defaultAddress ? "Manage addresses" : "Add an address"}
                        </button>
                    )}
                </dd>
            </div>

            {modal === "profile" && <EditProfileModal user={user} onClose={closeModal} />}
            {modal === "password" && <ChangePasswordModal onClose={closeModal} />}
        </section>
    );
}