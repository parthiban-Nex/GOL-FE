import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";

export default function Unauthorized() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50">
        <ShieldAlert className="h-8 w-8 text-danger-500" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-ink-800">You don't have access to this page</h1>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          Your account doesn't have the permission required to view this. Contact an admin if you
          think this is a mistake.
        </p>
      </div>
      <Link to={ROUTES.DASHBOARD}>
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
