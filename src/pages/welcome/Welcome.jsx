import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Welcome() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-brand-700 sm:text-5xl">
        Welcome {user?.roleLabel ?? ""}
      </h1>
      <p className="mt-4 flex items-center gap-2 text-base text-ink-500">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        You can navigate pages using Menu
      </p>
    </div>
  );
}
