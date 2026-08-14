const TOKEN_KEY = "vibebi_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers: extraHeaders, ...rest } = options;
  const headers = new Headers(extraHeaders);

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(path, {
    ...rest,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError(
      0,
      "无法连接后端服务，请先启动 host-backend（默认 http://127.0.0.1:8000）",
    );
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    let detail = response.statusText || "Request failed";
    if (typeof data === "object" && data && "detail" in data) {
      const raw = (data as { detail: unknown }).detail;
      detail = typeof raw === "string" ? raw : JSON.stringify(raw);
    } else if (typeof data === "string" && data.trim()) {
      // Vite proxy error HTML/text when backend is down
      if (response.status >= 500) {
        detail = "无法连接后端服务，请确认 host-backend 已在 8000 端口运行";
      } else {
        detail = data.slice(0, 120);
      }
    }

    if (detail === "Incorrect username or password") {
      detail = "用户名或密码错误";
    }

    throw new ApiError(response.status, detail);
  }

  return data as T;
}
