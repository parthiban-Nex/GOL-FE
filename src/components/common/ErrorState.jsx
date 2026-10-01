import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

/** Shown when a page/section fails to load data. Names what happened. */
export default function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50">
        <AlertTriangle className="h-6 w-6 text-danger-500" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium text-ink-800">{title}</p>
        <p className="mt-1 text-sm text-ink-500">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
