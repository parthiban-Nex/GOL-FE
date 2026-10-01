import { forwardRef } from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    placeholder,
    className,
    wrapperClassName,
    id,
    variant = "default",
    children,
    disabled,
    ...props
  },
  ref,
) {
  const selectId = id || props.name;

  return (
    <div className={clsx("w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-ink-700"
        >
          {label}
          {props.required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div className="relative w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={clsx(
            "w-full appearance-none text-sm focus-visible:outline-none",
            variant === "underline"
              ? "h-11 border-b bg-transparent px-1 pr-8"
              : "h-10 cursor-pointer rounded-lg border px-3 pr-9",
            disabled
              ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-400"
              : error
                ? "border-danger-500"
                : variant === "underline"
                  ? "border-ink-300 text-ink-800 focus-visible:border-brand-500"
                  : "border-ink-200 text-ink-800 focus-visible:border-brand-500",
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}

          {children
            ? children
            : options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
        </select>

        <ChevronDown
          className={clsx(
            "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2",
            variant === "underline" ? "right-2" : "right-3",
            disabled ? "text-ink-300" : "text-ink-400",
          )}
          aria-hidden="true"
        />
      </div>

      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
});

export default Select;
