import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";


export default function Service() {
  return <Navigate to={ROUTES.SERVICE_APPOINTMENT} replace />;
}