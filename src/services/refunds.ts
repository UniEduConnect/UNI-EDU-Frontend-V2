import { apiClient } from "@/lib/apiClient";
import type { CreateRefundRequest, Paged, RefundItem, ReviewRefundRequest } from "@/types/api";

export const requestRefund = (classId: string, payload: CreateRefundRequest) =>
  apiClient.post(`/Classes/${classId}/refund-request`, payload) as unknown as Promise<RefundItem>;
export const getRefunds = (params: { Status?: string; Page?: number } = {}) =>
  apiClient.get("/Finance/refunds", { params }) as unknown as Promise<Paged<RefundItem>>;
// Tutor-scoped: refunds raised on the caller tutor's own classes (Tutor role).
export const getMyRefunds = (params: { Status?: string; Page?: number } = {}) =>
  apiClient.get("/me/refunds", { params }) as unknown as Promise<Paged<RefundItem>>;
export const approveRefund = (id: string, payload: ReviewRefundRequest = {}) =>
  apiClient.post(`/Finance/refunds/${id}/approve`, payload) as unknown as Promise<unknown>;
export const rejectRefund = (id: string, payload: ReviewRefundRequest = {}) =>
  apiClient.post(`/Finance/refunds/${id}/reject`, payload) as unknown as Promise<unknown>;
