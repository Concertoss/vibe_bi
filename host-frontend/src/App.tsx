import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import DataPermissionPage from "./pages/DataPermissionPage";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import MenuManager from "./pages/MenuManager";
import ReportMetaPage from "./pages/ReportMetaPage";
import ReportPage from "./pages/ReportPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="admin/menus" element={<MenuManager />} />
            <Route path="admin/report-metas" element={<ReportMetaPage />} />
            <Route path="admin/data-permissions" element={<DataPermissionPage />} />
            <Route path="*" element={<ReportPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
