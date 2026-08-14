import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BarChart3, Loader2, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

type FormErrors = {
  username?: string;
  password?: string;
  form?: string;
};

export default function Login() {
  const { login, token, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && token) {
    return <Navigate to="/" replace />;
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!username.trim()) next.username = "请输入用户名";
    else if (username.trim().length < 2) next.username = "用户名至少 2 个字符";
    if (!password) next.password = "请输入密码";
    else if (password.length < 4) next.password = "密码至少 4 位";
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "登录失败";
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200/60 backdrop-blur"
        noValidate
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-600 p-2.5 text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium tracking-wide text-sky-700">VibeBI</p>
            <h1 className="mt-0.5 text-2xl font-semibold text-slate-900">登录底座</h1>
            <p className="mt-1 text-sm text-slate-500">AI 原生报表平台 Host</p>
          </div>
        </div>

        {errors.form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.form}
          </div>
        )}

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">用户名</span>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 outline-none transition focus:ring-2 focus:ring-sky-200 ${
                errors.username ? "border-red-400" : "border-slate-300 focus:border-sky-500"
              }`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
            />
          </div>
          {errors.username && <p className="text-xs text-red-600">{errors.username}</p>}
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-slate-700">密码</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 outline-none transition focus:ring-2 focus:ring-sky-200 ${
                errors.password ? "border-red-400" : "border-slate-300 focus:border-sky-500"
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "登录中…" : "进入系统"}
        </button>

        <p className="text-center text-xs text-slate-400">演示账号 admin / admin123</p>
      </form>
    </div>
  );
}
