import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Database,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Settings2,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, menus, dataScope, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const activeMenu = menus.find((m) => m.path === location.pathname);
  const pageTitle =
    location.pathname === "/"
      ? "工作台"
      : location.pathname.startsWith("/admin/menus")
        ? "菜单管理"
        : location.pathname.startsWith("/admin/report-metas")
          ? "报表元数据"
          : location.pathname.startsWith("/admin/data-permissions")
            ? "数据权限"
            : (activeMenu?.title ?? "报表");

  return (
    <div className="flex h-full min-h-screen bg-slate-100">
      <aside className="flex w-60 shrink-0 flex-col bg-slate-900 text-slate-100">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-5">
          <BarChart3 className="h-6 w-6 text-sky-400" />
          <div>
            <p className="text-base font-semibold tracking-tight">VibeBI</p>
            <p className="text-[11px] text-slate-400">Host Shell</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-white/10 ${
                isActive ? "bg-white/15 text-white" : "text-slate-300"
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            工作台
          </NavLink>

          <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            报表
          </div>
          {menus.length === 0 && (
            <p className="px-3 text-xs text-slate-500">暂无可用报表</p>
          )}
          {menus.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-white/10 ${
                  isActive ? "bg-white/15 text-white" : "text-slate-300"
                }`
              }
            >
              <MenuIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.title}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                管理
              </div>
              <NavLink
                to="/admin/menus"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-white/10 ${
                    isActive ? "bg-white/15 text-white" : "text-slate-300"
                  }`
                }
              >
                <Settings2 className="h-4 w-4" />
                菜单管理
              </NavLink>
              <NavLink
                to="/admin/report-metas"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-white/10 ${
                    isActive ? "bg-white/15 text-white" : "text-slate-300"
                  }`
                }
              >
                <Database className="h-4 w-4" />
                报表元数据
              </NavLink>
              <NavLink
                to="/admin/data-permissions"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 transition hover:bg-white/10 ${
                    isActive ? "bg-white/15 text-white" : "text-slate-300"
                  }`
                }
              >
                <Shield className="h-4 w-4" />
                数据权限
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <h1 className="text-base font-semibold text-slate-800">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{user?.username}</p>
              <p className="text-[11px] text-slate-400">
                {dataScope.length > 0 ? dataScope.join(" · ") : user?.dept_code}
              </p>
            </div>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
              {user?.role.role_name ?? user?.role.role_key}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              退出
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
