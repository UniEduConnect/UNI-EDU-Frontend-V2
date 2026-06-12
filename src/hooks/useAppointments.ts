import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/appointments";
import type { SaveAppointmentRequest } from "@/types/api";

// --- Appointments (Office) ---
export function useAppointments(params: { Status?: string; Page?: number } = {}) {
  const r = useQuery({ queryKey: ["appointments", params], queryFn: () => svc.getAppointments(params) });
  return { ...r, appointments: r.data?.items ?? [] };
}
function useApptInv() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["appointments"] });
}
export function useCreateAppointment() {
  const inv = useApptInv();
  return useMutation({ mutationFn: (p: SaveAppointmentRequest) => svc.createAppointment(p), onSuccess: inv });
}
export function useUpdateAppointment() {
  const inv = useApptInv();
  return useMutation({ mutationFn: ({ id, payload }: { id: string; payload: SaveAppointmentRequest }) => svc.updateAppointment(id, payload), onSuccess: inv });
}
export function useCancelAppointment() {
  const inv = useApptInv();
  return useMutation({ mutationFn: (id: string) => svc.cancelAppointment(id), onSuccess: inv });
}
export function useCompleteAppointment() {
  const inv = useApptInv();
  return useMutation({ mutationFn: (id: string) => svc.completeAppointment(id), onSuccess: inv });
}

// --- Registrations (Office): pending user sign-ups (AdminUserResponse) ---
export function useRegistrations(params: { Status?: string; Page?: number } = {}) {
  const r = useQuery({ queryKey: ["registrations", params], queryFn: () => svc.getRegistrations(params) });
  return { ...r, registrations: r.data?.items ?? [] };
}
function useRegInv() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["registrations"] });
}
export function useApproveRegistration() {
  const inv = useRegInv();
  return useMutation({ mutationFn: (id: string) => svc.approveRegistration(id), onSuccess: inv });
}
export function useRejectRegistration() {
  const inv = useRegInv();
  return useMutation({ mutationFn: ({ id, note }: { id: string; note?: string }) => svc.rejectRegistration(id, note), onSuccess: inv });
}
