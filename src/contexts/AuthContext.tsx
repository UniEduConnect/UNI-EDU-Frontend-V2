import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import * as authService from "@/services/auth";
import {
  clearToken,
  getToken,
  setToken,
  setOnUnauthorized,
} from "@/lib/authToken";
import { AppRole, roleFromClaim } from "@/lib/roleRoutes";
import type {
  JwtClaims,
  LoginRequest,
  StudentRegister,
  TutorRegister,
} from "@/types/api";

interface AuthUser {
  id: string;
  email: string;
  role: AppRole | null;
  rawRoleClaim: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  registerStudent: (payload: StudentRegister) => Promise<void>;
  registerTutor: (payload: TutorRegister) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

/** Decode a JWT into an AuthUser, or null if invalid/expired. */
function userFromToken(token: string | null): AuthUser | null {
  if (!token) return null;
  try {
    const claims = jwtDecode<JwtClaims>(token);
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return {
      id: claims.nameid,
      email: claims.email,
      role: roleFromClaim(claims.role),
      rawRoleClaim: claims.role,
    };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => userFromToken(getToken()));

  const doLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // best-effort; clear local state regardless
    }
    clearToken();
    setUser(null);
  }, []);

  // Let the axios 401 handler force a client-side logout.
  useEffect(() => {
    setOnUnauthorized(() => {
      clearToken();
      setUser(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const { accessToken } = await authService.login(payload);
    setToken(accessToken);
    const u = userFromToken(accessToken);
    setUser(u);
    if (!u) throw new Error("Phiên đăng nhập không hợp lệ.");
    return u;
  }, []);

  const registerStudent = useCallback(async (payload: StudentRegister) => {
    await authService.registerStudent(payload);
  }, []);

  const registerTutor = useCallback(async (payload: TutorRegister) => {
    await authService.registerTutor(payload);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      login,
      registerStudent,
      registerTutor,
      logout: doLogout,
    }),
    [user, login, registerStudent, registerTutor, doLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
