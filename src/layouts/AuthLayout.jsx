import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";

/** Minimal shell for unauthenticated pages (login, forgot password, ...). */
export default function AuthLayout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}
