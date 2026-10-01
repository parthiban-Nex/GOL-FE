import clsx from "clsx";

const TONES = {
  neutral: "bg-ink-100 text-ink-600",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-500",
  danger: "bg-danger-50 text-danger-500",
  warning: "bg-warning-50 text-warning-500",
};

export default function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
