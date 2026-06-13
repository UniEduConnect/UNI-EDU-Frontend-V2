import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as financeService from "@/services/finance";
import { getFinanceReports } from "@/services/reports";
import type { AdminTransactionListQuery, ReviewWithdrawalRequest, WithdrawalListQuery } from "@/types/api";

/** GET /Finance/reports — revenue/withdrawn/refunded/escrow + monthly series. */
export function useFinanceReports() {
  return useQuery({ queryKey: ["finance-reports"], queryFn: () => getFinanceReports() });
}

export function useFinanceTransactions(query: AdminTransactionListQuery = {}) {
  const result = useQuery({
    queryKey: ["finance-transactions", query],
    queryFn: () => financeService.getTransactions(query),
  });
  return { ...result, transactions: result.data?.items ?? [] };
}

export function useWithdrawals(query: WithdrawalListQuery = {}) {
  const result = useQuery({
    queryKey: ["finance-withdrawals", query],
    queryFn: () => financeService.getWithdrawals(query),
  });
  return { ...result, withdrawals: result.data?.items ?? [] };
}

function useWithdrawalsInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["finance-withdrawals"] });
}

export function useApproveWithdrawal() {
  const invalidate = useWithdrawalsInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ReviewWithdrawalRequest }) =>
      financeService.approveWithdrawal(id, payload),
    onSuccess: invalidate,
  });
}

export function useRejectWithdrawal() {
  const invalidate = useWithdrawalsInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ReviewWithdrawalRequest }) =>
      financeService.rejectWithdrawal(id, payload),
    onSuccess: invalidate,
  });
}
