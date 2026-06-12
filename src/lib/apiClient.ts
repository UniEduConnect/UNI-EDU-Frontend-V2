import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@/types/api";
import { clearToken, getToken, setToken, triggerUnauthorized } from "@/lib/authToken";

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!baseURL) {
  // Surfaced loudly in dev; in prod the requests just fail fast.
  console.error("VITE_API_BASE_URL is not set — API calls will fail. Check your .env file.");
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // refresh-token flow uses an httpOnly cookie on the server
  headers: { "Content-Type": "application/json" },
});

// --- Request: attach Bearer token -----------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// --- Response: unwrap the { statusCode, message, data } envelope -----------
// On success we return `response.data.data` so callers get the payload directly.
//
// A single in-flight refresh is shared across ALL concurrent 401s: the first
// failed request kicks off `/refresh-token`, every other 401 awaits the SAME
// promise and only retries once the new token is in place. This avoids the race
// where non-leader requests would retry with the stale token and force a logout.
let refreshPromise: Promise<string | null> | null = null;

function runRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post("/refresh-token")
      .then((r) => {
        const token = (r as unknown as { accessToken?: string })?.accessToken ?? null;
        if (token) setToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope<unknown>>) => {
    const body = response.data;
    if (body && typeof body === "object" && "data" in body) {
      return body.data as unknown as AxiosResponse;
    }
    return body as unknown as AxiosResponse;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;

    // One-shot refresh attempt on 401, then give up and force logout.
    const isRefreshCall = original?.url?.includes("/refresh-token");
    if (status === 401 && original && !original._retried && !isRefreshCall && getToken()) {
      original._retried = true;
      try {
        const newToken = await runRefresh();
        if (newToken) {
          return apiClient(original); // retry with the freshly-set token
        }
        // Refresh returned no token → session is dead.
        clearToken();
        triggerUnauthorized();
        return Promise.reject(new Error("Phiên đăng nhập đã hết hạn."));
      } catch {
        clearToken();
        triggerUnauthorized();
        return Promise.reject(new Error("Phiên đăng nhập đã hết hạn."));
      }
    }

    if (status === 401) {
      clearToken();
      triggerUnauthorized();
    }

    // Normalize the error so callers/toasts can use a friendly message.
    const message =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi. Vui lòng thử lại.";
    return Promise.reject(new Error(message));
  },
);
