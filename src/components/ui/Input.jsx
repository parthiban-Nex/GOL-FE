import { forwardRef } from "react";
import clsx from "clsx";

/**
 * Standard text input with label/error slots so forms stay consistent.
 * variant="outline" (default) - the usual bordered box, label sits above.
 * variant="underline" - bottom border only. The label doubles as the
 *   placeholder and floats above the field on focus or once it has a value
 *   (MUI "standard" TextField behavior).
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    className,
    id,
    variant = "outline",
    placeholder,
    ...props
  },
  ref,
) {
  const inputId = id || props.name;
  const isUnderline = variant === "underline";

  if (isUnderline) {
    return (
      <div className="relative w-full ">
        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
          )}

          <input
            ref={ref}
            id={inputId}
            // A non-empty placeholder is required for the :placeholder-shown
            // trick below to work - falls back to a single space.
            placeholder={placeholder || " "}
            className={clsx(
              "peer h-10 w-full rounded-none border-0 border-b bg-transparent text-base text-ink-900",
              "placeholder-transparent focus-visible:outline-none",
              Icon ? "pl-6 pr-3" : "px-0",
              error
                ? "border-danger-500"
                : "border-[#ccc] focus:border-brand-600",
              className,
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />

          {label && (
            <label
              htmlFor={inputId}
              className={clsx(
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-base text-[#999]",
                "max-w-[calc(100%-1.5rem)] truncate", 
                "transition-all duration-150",
                Icon ? "left-6" : "left-0",
                "peer-focus:top-0 peer-focus:-translate-y-full peer-focus:text-xs peer-focus:text-brand-600",
                "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-full peer-[:not(:placeholder-shown)]:text-xs",
              )}
            >
              {label}
              {props.required && <span className="text-red-500">*</span>}
            </label>
          )}
        </div>

        {error ? (
          <p className="absolute left-0 top-full mt-1 text-xs leading-4 text-danger-500">
            {error}
          </p>
        ) : (
          hint && (
            <p className="absolute left-0 top-full mt-1 text-xs leading-4 text-ink-400">
              {hint}
            </p>
          )
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-ink-700"
        >
          {label}
          {props.required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        )}

        <input
          ref={ref}
          id={inputId}
          placeholder={placeholder}
          className={clsx(
            "h-10 w-full rounded-lg border bg-white text-sm text-ink-800 placeholder:text-ink-400",
            "focus-visible:outline-none",
            props.type === "date" &&
              "cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            Icon ? "pl-9 pr-3" : "px-3",
            error
              ? "border-danger-500"
              : "border-ink-200 focus-visible:border-brand-500",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>

      {error ? (
        <p className="absolute left-0 top-full mt-1 text-xs leading-4 text-danger-500">
          {error}
        </p>
      ) : (
        hint && (
          <p className="absolute left-0 top-full mt-1 text-xs leading-4 text-ink-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
});

export default Input;
