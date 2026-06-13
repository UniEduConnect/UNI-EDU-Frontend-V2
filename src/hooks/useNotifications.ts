import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/notifications";

export function useNotifications(page = 1) {
  const result = useQuery({ queryKey: ["notifications", page], queryFn: () => svc.getNotifications(page), refetchInterval: 60_000 });
  return { ...result, notifications: result.data?.items ?? [] };
}
export function useUnreadCount() {
  const result = useQuery({ queryKey: ["notifications-unread"], queryFn: () => svc.getUnreadCount(), refetchInterval: 60_000 });
  return { ...result, count: result.data?.count ?? 0 };
}
function useInvalidate() {
  const qc = useQueryClient();
  return () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notifications-unread"] }); };
}
export function useMarkNotificationRead() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => svc.markRead(id), onSuccess: inv });
}
export function useMarkAllNotificationsRead() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: () => svc.markAllRead(), onSuccess: inv });
}
