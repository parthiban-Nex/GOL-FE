import clsx from "clsx";

const TONE_CLASSES = {
  edit: "hover:text-blue-600",
  brand: "hover:text-brand-700",
  assign: "hover:text-violet-600",
  danger: "hover:text-red-600",
  print: "hover:text-violet-600",
  download: "hover:text-emerald-600",
  view: "hover:text-ink-700",
};

export default function IconAction({ icon: Icon, label, onClick, disabled, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500 transition-colors",
        TONE_CLASSES[tone] ?? "hover:text-ink-700",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}