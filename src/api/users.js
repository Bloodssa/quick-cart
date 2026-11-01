import { api } from "./client";

export const changePassword = (values) => api.post("/users/me/password", values);