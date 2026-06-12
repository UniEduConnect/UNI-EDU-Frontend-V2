import { apiClient } from "@/lib/apiClient";
import type { CreateNotificationRequest, NotificationItem, Paged } from "@/types/api";

export const getNotifications = (page = 1) =>
  apiClient.get("/Notifications", { params: { page } }) as unknown as Promise<Paged<NotificationItem>>;
export const getUnreadCount = () =>
  apiClient.get("/Notifications/unread-count") as unknown as Promise<{ count: number }>;
export const markRead = (id: string) =>
  apiClient.patch(`/Notifications/${id}/read`) as unknown as Promise<unknown>;
export const markAllRead = () =>
  apiClient.patch("/Notifications/read-all") as unknown as Promise<unknown>;
export const createNotification = (payload: CreateNotificationRequest) =>
  apiClient.post("/Notifications", payload) as unknown as Promise<NotificationItem>;
