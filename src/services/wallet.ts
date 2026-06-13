import { apiClient } from "@/lib/apiClient";
import type {
  CreateWithdrawalRequest,
  DepositRequest,
  DepositResponse,
  DepositTestRequest,
  Paged,
  TestDepositConfirmResponse,
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

// DEV/DEMO ONLY: creates a Pending "test" transaction (no gateway, no payUrl).
export async function depositTest(payload: DepositTestRequest): Promise<DepositResponse> {
  return apiClient.post("/Wallet/deposit-test", payload) as unknown as Promise<DepositResponse>;
}

// DEV/DEMO ONLY: settles a "test" transaction and credits the wallet (replaces the real IPN).
export async function confirmDepositTest(transactionId: string): Promise<TestDepositConfirmResponse> {
  return apiClient.post(
    `/Wallet/deposit-test/${transactionId}/confirm`,
  ) as unknown as Promise<TestDepositConfirmResponse>;
}

export async function withdraw(payload: CreateWithdrawalRequest): Promise<unknown> {
  return apiClient.post("/Wallet/withdraw", payload) as unknown as Promise<unknown>;
}

// Forward VNPay's signed browser-return query params to the backend so the wallet credits
// immediately (verified + idempotent), independent of the server-to-server IPN.
export async function confirmVnPayReturn(search: string): Promise<{ status: string; amount: number }> {
  return apiClient.get(`/Wallet/deposit/vnpay-return${search}`) as unknown as Promise<{ status: string; amount: number }>;
}
