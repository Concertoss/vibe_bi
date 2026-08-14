import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "vibebi_token";

/** Prefer Wujie host props token; fall back to localStorage / window debug token. */
export function resolveAuthToken(): string | null {
  const fromWujie = window.$wujie?.props?.token;
  if (typeof fromWujie === "string" && fromWujie) {
    return fromWujie;
  }
  if (typeof window.__VIBEBI_LOCAL_TOKEN__ === "string" && window.__VIBEBI_LOCAL_TOKEN__) {
    return window.__VIBEBI_LOCAL_TOKEN__;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * When embedded in Host, prefer calling through gateway proxy if provided.
 * Otherwise hit local Vite `/api` proxy → template-report-backend.
 */
export function resolveApiBase(): string {
  const proxyBase = window.$wujie?.props?.proxyBase;
  if (typeof proxyBase === "string" && proxyBase) {
    return proxyBase.replace(/\/$/, "");
  }
  return "";
}

export const http: AxiosInstance = axios.create({
  timeout: 30000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const base = resolveApiBase();
  if (base && config.url && config.url.startsWith("/")) {
    config.url = `${base}${config.url}`;
  }

  const token = resolveAuthToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
