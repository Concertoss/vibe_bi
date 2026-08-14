import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import ReportContainer from "../components/ReportContainer";
import { useAuth } from "../context/AuthContext";

/** Resolve current path to a menu item and mount Wujie. */
export default function ReportPage() {
  const { menus } = useAuth();
  const location = useLocation();

  const menu = useMemo(
    () => menus.find((m) => m.path === location.pathname),
    [menus, location.pathname],
  );

  if (!menu) {
    return (
      <div className="flex h-[calc(100vh-7rem)] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500">
        <FileQuestion className="h-8 w-8 text-slate-400" />
        <p className="text-sm">未找到报表菜单：{location.pathname}</p>
      </div>
    );
  }

  return <ReportContainer menu={menu} />;
}
