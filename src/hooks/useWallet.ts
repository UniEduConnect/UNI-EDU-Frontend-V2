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

// DEV/DEMO helper: runs the two-step test-deposit flow (create Pending → confirm/credit)
// in one mutation so a single click tops the wallet up without a real payment gateway.
export function useTestDeposit() {
  const qc = useQueryClient();
  return useMutation({
    // `note` carries the bank-transfer memo (e.g. "UNIEDU NAP A1B2C3") into the transaction
    // description so it shows as the transaction content.
    mutationFn: async ({ amount, note }: { amount: number; note?: string }) => {
      const created = await walletService.depositTest({ amount, note });
      return walletService.confirmDepositTest(created.transactionId);
    },
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
