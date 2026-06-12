import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as walletService from "@/services/wallet";
import type { CreateWithdrawalRequest, DepositRequest, WalletTransactionItem } from "@/types/api";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletService.getWallet(),
  });
}

export function useWalletTransactions(page = 1) {
  const result = useQuery({
    queryKey: ["wallet-transactions", page],
    queryFn: () => walletService.getTransactions(page),
  });
  const transactions: WalletTransactionItem[] = result.data?.items ?? [];
  return { ...result, transactions };
}

function invalidateWallet(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["wallet"] });
  qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
}

export function useDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepositRequest) => walletService.deposit(payload),
    onSuccess: () => invalidateWallet(qc),
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWithdrawalRequest) => walletService.withdraw(payload),
    onSuccess: () => invalidateWallet(qc),
  });
}
