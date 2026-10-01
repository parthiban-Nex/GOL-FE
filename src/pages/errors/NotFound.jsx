import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
        <Compass className="h-8 w-8 text-brand-500" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-ink-800">Page not found</h1>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          The page you're looking for doesn't exist or may have moved.
        </p>
      </div>
      <Link to={ROUTES.DASHBOARD}>
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
