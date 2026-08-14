import { Link } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, menus, dataScope, isAdmin } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky-50 p-2.5 text-sky-700">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              你好，{user?.username}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              角色 {user?.role.role_name} · 部门 {user?.dept_code}
              {dataScope.length > 0 ? ` · 数据范围 ${dataScope.join("、")}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">可用报表</h3>
          {isAdmin && (
            <Link
              to="/admin/menus"
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:underline"
            >
              管理菜单 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        {menus.length === 0 ? (
          <p className="text-sm text-slate-500">当前角色暂无报表权限。</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {menus.map((m) => (
              <li key={m.id}>
                <Link
                  to={m.path}
                  className="block rounded-xl border border-slate-200 px-4 py-3 transition hover:border-sky-300 hover:bg-sky-50/50"
                >
                  <p className="font-medium text-slate-800">{m.title}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{m.component_url}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
