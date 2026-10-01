import { forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline-accent-600",
  secondary:
    "bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 focus-visible:outline-brand-500",
  tertiary:
    "bg-white border border-blue-700  px-3 py-2 text-sm font-medium text-blue-700 ",
  primaryFilled:
    "bg-blue-700 border border-blue-700 px-3 py-2 text-sm font-medium text-white",
  ghost: "text-ink-600 hover:bg-ink-100 focus-visible:outline-brand-500",
  danger:
    "bg-danger-500 text-white hover:bg-red-700 focus-visible:outline-danger-500",
  link: "text-brand-600 hover:underline p-0 h-auto",
  border: "text-accent-500 border border-accent-500 bg-white",
  primaryDark: "bg-[#1e2858] text-white hover:bg-[#151c3f]",
  plain: "",
};

const SIZES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2",
};

/** The one Button component for the whole app - never re-style buttons ad hoc. */
const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading,
    icon: Icon,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        variant !== "plain" &&
          "inline-flex items-center cursor-pointer justify-center rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        variant !== "link" && variant !== "plain" && SIZES[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
});

export default Button;
