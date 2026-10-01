import { Loader2 } from "lucide-react";

/** Full-viewport loader used for route-level Suspense and session restore. */
export default function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-ink-50">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}
