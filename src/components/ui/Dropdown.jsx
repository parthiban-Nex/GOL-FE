import { useEffect, useRef, useState } from "react";
import clsx from "clsx";


export default function Dropdown({ trigger, children, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setIsOpen((v) => !v)}>{trigger}</div>
      {isOpen && (
        <div
          role="menu"
          className={clsx(
            "absolute z-40 mt-2 w-52 overflow-hidden rounded-lg border border-ink-100 bg-white py-1 shadow-popover",
            align === "right" ? "right-0" : "left-0"
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

Dropdown.Item = function DropdownItem({ icon: Icon, className, children, ...props }) {
  return (
    <button
      role="menuitem"
      className={clsx(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm  hover:bg-ink-50",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 " aria-hidden="true" />}
      {children}
    </button>
  );
};
