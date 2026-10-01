
import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";


export default function Finance() {
  return <Navigate to={ROUTES.FINANCE_WALLET} replace />;
}
