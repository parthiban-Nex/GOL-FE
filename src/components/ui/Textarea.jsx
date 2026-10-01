import { forwardRef } from "react";
import clsx from "clsx";

const Textarea = forwardRef(function Textarea(
  { label, error, className, id, required, rows = 3, ...props },
  ref,
) {
  const textareaId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-sm font-medium text-ink-700"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        className={clsx(
          "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-ink-700",
          "placeholder:text-ink-400",
          "focus-visible:outline-none",
          error
            ? "border-danger-500"
            : "border-ink-200 focus-visible:border-brand-500",
          className,
        )}
        {...props}
      />

      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
});

export default Textarea;
