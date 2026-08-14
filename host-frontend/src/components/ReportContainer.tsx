import WujieReact from "wujie-react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { MenuItem } from "../types";

type Props = {
  menu: MenuItem;
};

/**
 * Wujie micro-frontend container.
 * Passes host token/user to the child app via props (child can read window.$wujie?.props).
 */
export default function ReportContainer({ menu }: Props) {
  const { token, user, dataScope } = useAuth();

  if (!menu.component_url) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-800">
        <div className="flex max-w-md items-start gap-3 px-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">未配置前端入口</p>
            <p className="mt-1 text-sm">
              菜单「{menu.title}」缺少 <code className="text-xs">component_url</code>
              ，请在菜单管理中补充子报表地址。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <WujieReact
        width="100%"
        height="100%"
        name={menu.report_code}
        url={menu.component_url}
        sync={false}
        alive
        props={{
          token,
          user,
          dataScope,
          reportCode: menu.report_code,
          // Sub-apps should call host via /api/proxy/{reportCode}/...
          proxyBase: `/api/proxy/${menu.report_code}`,
        }}
      />
    </div>
  );
}
