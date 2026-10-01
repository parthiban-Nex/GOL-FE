import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PartsCategorySelector from "@/components/catalogue/PartsCategorySelector";
import {
  PARTS_CATEGORIES,
  PARTS_SUB_CATEGORIES,
} from "@/constants/partsTaxonomy";

/**
 * Parts Catalogue picker - search box, Categories and Sub Categories
 * panels, and an Explore Product action.
 *
 * Opened from Estimate step 2 and Job Card step 3 (which renders the
 * same Step2Items component, so it gets this for free). It does not
 * fetch or add anything itself: Explore Product hands the selection back
 * through `onExplore`, and the caller decides what to show. That keeps
 * it reusable for any screen that needs "pick some parts categories".
 *
 * @param {(selection: { terms: string[], categoryIds: string[],
 *   subCategoryIds: string[] }) => void} onExplore
 */
export default function PartsCatalogueModal({ isOpen, onClose, onExplore }) {
  const [search, setSearch] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [subCategoryIds, setSubCategoryIds] = useState([]);

  // Start clean each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setCategoryIds([]);
    setSubCategoryIds([]);
  }, [isOpen]);

  // Only the sub-categories of the categories actually picked.
  const visibleSubCategories = useMemo(
    () =>
      PARTS_SUB_CATEGORIES.filter((sub) =>
        categoryIds.includes(sub.categoryId),
      ),
    [categoryIds],
  );

  function toggleCategory(id) {
    setCategoryIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      // Deselecting a category drops any sub-categories that belonged to it.
      setSubCategoryIds((subs) =>
        subs.filter((subId) => {
          const sub = PARTS_SUB_CATEGORIES.find((s) => s.id === subId);
          return sub && next.includes(sub.categoryId);
        }),
      );
      return next;
    });
  }

  function toggleSubCategory(id) {
    setSubCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleExplore() {
    onExplore?.({
      // "wiper, brake pad, filter" -> ["wiper", "brake pad", "filter"]
      terms: search
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      categoryIds,
      subCategoryIds,
    });
  }

  const hasSelection =
    search.trim() || categoryIds.length > 0 || subCategoryIds.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Parts Catalogue"
      size="xl"
      footer={
        <Button onClick={handleExplore} disabled={!hasSelection}>
          Explore Product
        </Button>
      }
    >
      <div className="space-y-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search parts (e.g., wiper, brake pad, filter) — comma separated"
          className="h-12 w-full rounded-xl border-2 border-blue-500 bg-white px-4 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />

        <PartsCategorySelector
          size="md"
          categories={PARTS_CATEGORIES}
          selectedCategoryIds={categoryIds}
          onToggleCategory={toggleCategory}
          subCategories={visibleSubCategories}
          selectedSubCategoryIds={subCategoryIds}
          onToggleSubCategory={toggleSubCategory}
        />
      </div>
    </Modal>
  );
}

/**
 * Applies a catalogue selection to a list of catalogue items.
 * Exported so every screen that uses the modal filters the same way.
 *
 * An item matches when it satisfies every part of the selection that
 * was actually used: its category is under a picked category, its name
 * contains a picked sub-category, and its name contains a search term.
 */
export function filterCatalogue(
  items,
  { terms = [], categoryIds = [], subCategoryIds = [] },
) {
  const catalogCategories = new Set(
    PARTS_CATEGORIES.filter((c) => categoryIds.includes(c.id)).flatMap(
      (c) => c.catalogCategories,
    ),
  );
  const subNames = PARTS_SUB_CATEGORIES.filter((s) =>
    subCategoryIds.includes(s.id),
  ).map((s) => s.name.toLowerCase());
  const lowerTerms = terms.map((t) => t.toLowerCase());

  return items.filter((item) => {
    const name = String(item.name ?? "").toLowerCase();
    if (categoryIds.length && !catalogCategories.has(item.category))
      return false;
    if (subNames.length && !subNames.some((s) => name.includes(s)))
      return false;
    if (lowerTerms.length && !lowerTerms.some((t) => name.includes(t)))
      return false;
    return true;
  });
}
