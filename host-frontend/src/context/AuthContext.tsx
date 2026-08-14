import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, clearToken, getToken, setToken } from "../lib/api";
import { fetchCurrentUser, loginApi } from "../lib/auth-api";
import type { MenuItem, User } from "../types";

type AuthState = {
  token: string | null;
  user: User | null;
  menus: MenuItem[];
  dataScope: string[];
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [dataScope, setDataScope] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const reset = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setMenus([]);
    setDataScope([]);
  }, []);

  const refresh = useCallback(async () => {
    const current = getToken();
    if (!current) {
      reset();
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCurrentUser();
      setTokenState(current);
      setUser(data.user);
      setMenus(data.menus);
      setDataScope(data.data_scope);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        reset();
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    refresh().catch(() => {
      // silent on boot — Login page will handle unauthenticated state
      setLoading(false);
    });
  }, [refresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await loginApi(username, password);
      setToken(res.access_token);
      setTokenState(res.access_token);
      const data = await fetchCurrentUser();
      setUser(data.user);
      setMenus(data.menus);
      setDataScope(data.data_scope);
    },
    [],
  );

  const logout = useCallback(() => {
    reset();
  }, [reset]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      menus,
      dataScope,
      loading,
      login,
      logout,
      refresh,
      isAdmin: user?.role.role_key === "admin",
    }),
    [token, user, menus, dataScope, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
