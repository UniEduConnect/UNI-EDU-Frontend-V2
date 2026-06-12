import { apiClient } from "@/lib/apiClient";
import type {
  AdminTransactionListQuery,
  AdminTransactionResponse,
  Paged,
  ReviewWithdrawalRequest,
  WithdrawalAdminResponse,
  WithdrawalListQuery,
} from "@/types/api";

export async function getTransactions(
  query: AdminTransactionListQuery = {},
): Promise<Paged<AdminTransactionResponse>> {
  return apiClient.get("/Finance/transactions", { params: query }) as unknown as Promise<
    Paged<AdminTransactionResponse>
  >;
}

export async function getWithdrawals(
  query: WithdrawalListQuery = {},
): Promise<Paged<WithdrawalAdminResponse>> {
  return apiClient.get("/Finance/withdrawals", { params: query }) as unknown as Promise<
    Paged<WithdrawalAdminResponse>
  >;
}

export async function approveWithdrawal(id: string, payload: ReviewWithdrawalRequest = {}): Promise<unknown> {
  return apiClient.post(`/Finance/withdrawals/${id}/approve`, payload) as unknown as Promise<unknown>;
}

export async function rejectWithdrawal(id: string, payload: ReviewWithdrawalRequest = {}): Promise<unknown> {
  return apiClient.post(`/Finance/withdrawals/${id}/reject`, payload) as unknown as Promise<unknown>;
}
