import { Minus, Plus } from "lucide-react";
import clsx from "clsx";


export default function CatalogueQtyStepper({ value, onChange, min = 0, max = 999, size = "sm", disabled = false }) {
  const btn = size === "xs" ? "h-6 w-6" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const box = size === "xs" ? "h-6 min-w-[26px] text-xs" : size === "sm" ? "h-7 min-w-[36px] text-sm" : "h-8 min-w-[40px]";
  const icon = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";

  function dec() { if (value > min) onChange(value - 1); }
  function inc() { if (value < max) onChange(value + 1); }

  return (
    <div className={clsx("inline-flex items-center overflow-hidden rounded border border-ink-200 bg-white", disabled && "opacity-60")}>
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        className={clsx(btn, "flex items-center cursor-pointer justify-center text-ink-500 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40")}
        aria-label="Decrease quantity"
      >
        <Minus className={icon} />
      </button>
      <span className={clsx(box, "flex items-center justify-center border-x border-ink-200 px-1 font-semibold text-ink-800")}>
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        className={clsx(btn, "flex items-center cursor-pointer justify-center text-accent-600 hover:bg-accent-50 disabled:cursor-not-allowed disabled:opacity-40")}
        aria-label="Increase quantity"
      >
        <Plus className={icon} />
      </button>
    </div>
  );
}