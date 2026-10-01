import Card from "@/components/ui/Card";
import { Construction } from "lucide-react";

export default function ModulePlaceholder({ title, description }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
        <Construction className="h-6 w-6 text-brand-500" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-semibold text-ink-800">{title}</h1>
      <p className="max-w-md text-sm text-ink-500">
        {description ?? "This module is scaffolded and ready for development - route, sidebar entry, and permissions are already wired up."}
      </p>
    </Card>
  );
}
