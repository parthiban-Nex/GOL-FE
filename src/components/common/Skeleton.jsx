import clsx from "clsx";

/** Basic pulse-loading placeholder block; compose for skeleton rows/cards. */
export default function Skeleton({ className }) {
  return <div className={clsx("animate-pulse rounded-md bg-ink-200/70", className)} />;
}

export function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="divide-y divide-ink-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 px-6 py-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
