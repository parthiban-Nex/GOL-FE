import { Toaster } from "react-hot-toast";
import AuthProvider from "@/auth/AuthProvider";
import { LayoutProvider } from "@/context/LayoutContext";
export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <LayoutProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "10px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
            error: { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
          }}
        />
      </LayoutProvider>
    </AuthProvider>
  );
}
