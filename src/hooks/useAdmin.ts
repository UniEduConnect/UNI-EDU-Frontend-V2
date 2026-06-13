import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminService from "@/services/admin";
import { getAdminReports } from "@/services/reports";
import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserListQuery,
  RejectUserRequest,
} from "@/types/api";

/** GET /Admin/reports — { totalUsers, totalClasses, totalExams, totalRevenue, monthlyRevenue[] }. */
export function useAdminReports() {
  return useQuery({ queryKey: ["admin-reports"], queryFn: () => getAdminReports() });
}

export function useAdminUsers(query: AdminUserListQuery = {}) {
  const result = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => adminService.getUsers(query),
  });
  return { ...result, users: result.data?.items ?? [] };
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => adminService.getUser(id as string),
    enabled: !!id,
  });
}

export function useAuditLogs(page = 1) {
  const result = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => adminService.getAuditLogs(page),
  });
  return { ...result, logs: result.data?.items ?? [] };
}

function useAdminUsersInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin-users"] });
}

export function useApproveUser() {
  const invalidate = useAdminUsersInvalidate();
  return useMutation({
    mutationFn: (id: string) => adminService.approveUser(id),
    onSuccess: invalidate,
  });
}

export function useRejectUser() {
  const invalidate = useAdminUsersInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectUserRequest }) =>
      adminService.rejectUser(id, payload),
    onSuccess: invalidate,
  });
}

export function useSuspendUser() {
  const invalidate = useAdminUsersInvalidate();
  return useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: invalidate,
  });
}

export function useCreateUser() {
  const invalidate = useAdminUsersInvalidate();
  return useMutation({
    mutationFn: (payload: AdminCreateUserRequest) => adminService.createUser(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useAdminUsersInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUpdateUserRequest }) =>
      adminService.updateUser(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useAdminUsersInvalidate();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: invalidate,
  });
}
