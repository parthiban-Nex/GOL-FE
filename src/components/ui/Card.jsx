import clsx from "clsx";

/** Plain content container with the app's standard card chrome. */
export default function Card({ className, children, padded = true, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-ink-100 bg-white shadow-card",
        padded && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
