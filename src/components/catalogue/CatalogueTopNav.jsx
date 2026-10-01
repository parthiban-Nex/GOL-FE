import clsx from "clsx";

const DEFAULT_TABS = [
  { key: "catalogue", label: "PARTS CATALOGUE" },
  { key: "cart",      label: "CART" },
  { key: "orders",    label: "MY ORDERS" },
];


export default function CatalogueTopNav({ current, onChange, cartCount = 0, tabs = DEFAULT_TABS }) {
  return (
    <nav className="flex flex-wrap items-center gap-6" aria-label="Catalogue tabs">
      {tabs.map((tab) => {
        const active = tab.key === current;
        const showBadge = tab.key === "cart" && cartCount > 0;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={clsx(
              "relative px-1 pb-1.5 cursor-pointer text-sm font-semibold tracking-wide transition-colors",
              active
                ? "text-accent-600 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-accent-500"
                : "text-ink-500 hover:text-ink-700"
            )}
          >
            <span>{tab.label}</span>
            {showBadge && (
              <span className="absolute -right-4 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
