import { apiClient } from "@/lib/apiClient";
import type {
  CreateWithdrawalRequest,
  DepositRequest,
  DepositResponse,
  Paged,
  Wallet,
  WalletTransactionItem,
} from "@/types/api";

export async function getWallet(): Promise<Wallet> {
  return apiClient.get("/Wallet") as unknown as Promise<Wallet>;
}

export async function getTransactions(page = 1): Promise<Paged<WalletTransactionItem>> {
  return apiClient.get("/Wallet/transactions", { params: { Page: page } }) as unknown as Promise<
    Paged<WalletTransactionItem>
  >;
}

export async function deposit(payload: DepositRequest): Promise<DepositResponse> {
  return apiClient.post("/Wallet/deposit", payload) as unknown as Promise<DepositResponse>;
}

export async function withdraw(payload: CreateWithdrawalRequest): Promise<unknown> {
  return apiClient.post("/Wallet/withdraw", payload) as unknown as Promise<unknown>;
}

// Forward VNPay's signed browser-return query params to the backend so the wallet credits
// immediately (verified + idempotent), independent of the server-to-server IPN.
export async function confirmVnPayReturn(search: string): Promise<{ status: string; amount: number }> {
  return apiClient.get(`/Wallet/deposit/vnpay-return${search}`) as unknown as Promise<{ status: string; amount: number }>;
}
