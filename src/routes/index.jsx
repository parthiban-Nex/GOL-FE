import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "@/layouts/AuthLayout";
import AdminLayout from "@/layouts/AdminLayout";
import ProtectedRoute from "@/auth/ProtectedRoute";
import PermissionRoute from "@/auth/PermissionRoute";
import {
  publicRoutes,
  protectedRoutes,
  utilityRoutes,
  dynamicModuleRoute,
} from "@/routes/routeConfig";
import { ROUTES } from "@/constants/routes";

export default function AppRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to={ROUTES.WELCOME} replace />} />

      {/* Public */}
      <Route element={<AuthLayout />}>
        {publicRoutes.map(({ path, element: Element }) => (
          <Route key={path} path={path} element={<Element />} />
        ))}
      </Route>

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {protectedRoutes.map(
            ({ path, element: Element, requireAction, alwaysAllowed }) => (
              <Route
                key={path}
                element={
                  <PermissionRoute
                    requireAction={requireAction}
                    alwaysAllowed={alwaysAllowed}
                  />
                }
              >
                <Route path={path} element={<Element />} />
              </Route>
            ),
          )}
          <Route
            path={utilityRoutes.unauthorized.path}
            element={<utilityRoutes.unauthorized.element />}
          />
          <Route
            path={dynamicModuleRoute.path}
            element={<dynamicModuleRoute.element />}
          />
        </Route>
      </Route>

      <Route
        path={utilityRoutes.notFound.path}
        element={<utilityRoutes.notFound.element />}
      />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
    </Routes>
  );
}
