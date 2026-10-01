import { Inbox } from "lucide-react";


export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
        <Icon className="h-6 w-6 text-ink-400" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium text-ink-800">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
