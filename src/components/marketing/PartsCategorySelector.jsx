import clsx from "clsx";
import { Layers } from "lucide-react";

export default function PartsCategorySelector({
  categories = [],
  selectedCategoryIds = [],
  onToggleCategory,
  subCategories = [],
  selectedSubCategoryIds = [],
  onToggleSubCategory,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column: Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xs font-bold text-ink-900 tracking-wide">Categories</h3>
          <span className="inline-flex items-center rounded-full bg-[#1b2559] px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {selectedCategoryIds.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id);

            return (
              <button
                key={cat.id}
                onClick={() => onToggleCategory?.(cat.id)}
                type="button"
                className={clsx(
                  "flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs text-left",
                  isSelected
                    ? "border-blue-500 bg-blue-50/40 text-blue-600 ring-1 ring-blue-500/30"
                    : "border-ink-200/80 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50/30"
                )}
              >
                <Layers
                  className={clsx(
                    "h-3.5 w-3.5 shrink-0 stroke-[2]",
                    isSelected ? "text-blue-600" : "text-ink-400"
                  )}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Sub Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xs font-bold text-ink-900 tracking-wide">Sub Categories</h3>
          <span className="inline-flex items-center rounded-full bg-[#1b2559] px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {selectedSubCategoryIds.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {subCategories.map((sub) => {
            const isSelected = selectedSubCategoryIds.includes(sub.id);

            return (
              <button
                key={sub.id}
                onClick={() => onToggleSubCategory?.(sub.id)}
                type="button"
                className={clsx(
                  "flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs text-left",
                  isSelected
                    ? "border-blue-500 bg-blue-50/40 text-blue-600 ring-1 ring-blue-500/30"
                    : "border-ink-200/80 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50/30"
                )}
              >
                <Layers
                  className={clsx(
                    "h-3.5 w-3.5 shrink-0 stroke-[2]",
                    isSelected ? "text-blue-600" : "text-ink-400"
                  )}
                />
                <span className="truncate">{sub.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
