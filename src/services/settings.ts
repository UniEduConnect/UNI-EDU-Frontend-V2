import { apiClient } from "@/lib/apiClient";
import type { SystemSettings } from "@/types/api";

export const getSettings = () => apiClient.get("/Admin/settings") as unknown as Promise<SystemSettings>;
export const updateSettings = (payload: Partial<SystemSettings>) =>
  apiClient.put("/Admin/settings", payload) as unknown as Promise<SystemSettings>;
