import { useMutation } from "@tanstack/react-query";
import { changePassword, updateProfile } from "../api/users";
import { useAuth } from "../context/AuthContext";

export const useChangePassword = () =>
    useMutation({
        mutationFn: changePassword,
    });

export const useUpdateProfile = () => {
    const { updateUser } = useAuth();

    return useMutation({
        mutationFn: updateProfile,
        onSuccess: (updated) => {
            updateUser(updated);
        },
    });
};