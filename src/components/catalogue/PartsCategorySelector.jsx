import clsx from "clsx";
import {
  Layers,
  Sparkles,
  BatteryMedium,
  Cog,
  Package,
  Car,
  Cable,
  Wrench,
  Zap,
  Filter,
  Droplets,
  Fuel,
  Square,
  Volume2,
  Wind,
  Lightbulb,
  CircleDot,
} from "lucide-react";

/** Icon keys used in constants/partsTaxonomy.js. Anything unknown falls
 * back to Layers, so an item without an icon still renders. */
const ICONS = {
  accessories: Sparkles,
  battery: BatteryMedium,
  bearing: Cog,
  package: Package,
  body: Car,
  brake: CircleDot,
  cable: Cable,
  wrench: Wrench,
  electric: Zap,
  filter: Filter,
  fluid: Droplets,
  fuel: Fuel,
  glass: Square,
  horn: Volume2,
  hvac: Wind,
  lighting: Lightbulb,
};

export default function PartsCategorySelector({
  categories = [],
  selectedCategoryIds = [],
  onToggleCategory,
  subCategories = [],
  selectedSubCategoryIds = [],
  onToggleSubCategory,
  size = "sm",
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel
        title="Categories"
        items={categories}
        selectedIds={selectedCategoryIds}
        onToggle={onToggleCategory}
        size={size}
      />
      <Panel
        title="Sub Categories"
        items={subCategories}
        selectedIds={selectedSubCategoryIds}
        onToggle={onToggleSubCategory}
        size={size}
        emptyText="Select a category to see its sub categories."
      />
    </div>
  );
}

function Panel({ title, items, selectedIds, onToggle, size, emptyText }) {
  const isMd = size === "md";

  return (
    <div
      className={clsx(
        "space-y-4",
        isMd && "rounded-2xl border border-ink-100 bg-white p-5",
      )}
    >
      <div className="flex items-center gap-2.5">
        <h3
          className={clsx(
            "font-bold tracking-wide text-ink-900",
            isMd ? "text-base" : "text-xs",
          )}
        >
          {title}
        </h3>
        <span
          className={clsx(
            "inline-flex items-center rounded-full bg-[#1b2559] font-semibold text-white",
            isMd ? "px-3 py-0.5 text-xs" : "px-2.5 py-0.5 text-[10px]",
          )}
        >
          {selectedIds.length} selected
        </span>
      </div>

      {items.length === 0 && emptyText ? (
        <p className="text-sm text-ink-400">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const Icon = ICONS[item.icon] ?? Layers;

            return (
              <button
                key={item.id}
                onClick={() => onToggle?.(item.id)}
                type="button"
                aria-pressed={isSelected}
                className={clsx(
                  "flex items-center gap-2.5 rounded-xl border text-left font-semibold shadow-2xs transition-all cursor-pointer",
                  isMd ? "px-4 py-2.5 text-sm" : "px-3.5 py-2 text-[11px]",
                  isSelected
                    ? "border-blue-500 bg-blue-50/40 text-blue-600 ring-1 ring-blue-500/30"
                    : "border-ink-200/80 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50/30",
                )}
              >
                <Icon
                  className={clsx(
                    "shrink-0 stroke-[2]",
                    isMd ? "h-4 w-4" : "h-3.5 w-3.5",
                    isSelected ? "text-blue-600" : "text-ink-400",
                  )}
                />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
