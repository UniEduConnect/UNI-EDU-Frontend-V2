import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/refunds";
import type { CreateRefundRequest, ReviewRefundRequest } from "@/types/api";

export function useRefunds(params: { Status?: string; Page?: number } = {}) {
  const result = useQuery({ queryKey: ["refunds", params], queryFn: () => svc.getRefunds(params) });
  return { ...result, refunds: result.data?.items ?? [] };
}
function useInv() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ["refunds"] }); }
export function useRequestRefund() { const inv = useInv(); return useMutation({ mutationFn: ({ classId, payload }: { classId: string; payload: CreateRefundRequest }) => svc.requestRefund(classId, payload), onSuccess: inv }); }
export function useApproveRefund() { const inv = useInv(); return useMutation({ mutationFn: ({ id, payload }: { id: string; payload?: ReviewRefundRequest }) => svc.approveRefund(id, payload), onSuccess: inv }); }
export function useRejectRefund() { const inv = useInv(); return useMutation({ mutationFn: ({ id, payload }: { id: string; payload?: ReviewRefundRequest }) => svc.rejectRefund(id, payload), onSuccess: inv }); }
