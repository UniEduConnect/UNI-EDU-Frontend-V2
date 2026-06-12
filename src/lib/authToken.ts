// Tiny token store shared between the axios client and AuthContext, so the
// interceptors can read the token / trigger logout without importing React.

const TOKEN_KEY = "uniedu_access_token";

let onUnauthorized: (() => void) | null = null;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** AuthContext registers a handler here so a hard 401 can force a logout/redirect. */
export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function triggerUnauthorized(): void {
  onUnauthorized?.();
}
