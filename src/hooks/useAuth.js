import { useContext } from "react";
import { AuthContext } from "@/auth/AuthProvider";

/** Read auth state/actions anywhere: const { user, menu } = useAuth(); */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside <AuthProvider>.");
  }
  return ctx;
}
