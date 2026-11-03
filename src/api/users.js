import { api } from "./client";

export const changePassword = (values) => api.post("/users/me/password", values);

export const updateProfile = (payload) => api.put("/users/me", payload).then((res) => res.data);