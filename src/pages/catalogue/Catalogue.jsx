import { Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";


export default function Catalogue() {
  return <Navigate to={ROUTES.CATALOGUE_GLOBAL} replace />;
}
