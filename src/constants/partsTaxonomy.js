/**
 * Parts category / sub-category taxonomy, shared by:
 *   - the Parts Catalogue modal (Estimate step 2, Job Card step 3)
 *   - Marketing > Campaigns Parts Order
 *
 * `icon` is a key resolved by components/catalogue/PartsCategorySelector.
 * `catalogCategories` maps a taxonomy category onto the category names
 * the estimate CATALOG uses ("FILTERS" -> "Filters", "BRAKE SYSTEM" ->
 * "Brake Pads"), which is what lets Explore Product filter it.
 * Sub-categories carry their parent `categoryId`, so the right-hand panel
 * only lists sub-categories of the categories actually selected.
 */
export const PARTS_CATEGORIES = Object.freeze([
  {
    id: "cat-1",
    name: "ACCESSORIES",
    icon: "accessories",
    catalogCategories: [],
  },
  { id: "cat-2", name: "BATTERY", icon: "battery", catalogCategories: [] },
  {
    id: "cat-3",
    name: "BEARING",
    icon: "bearing",
    catalogCategories: ["Bearings"],
  },
  {
    id: "cat-4",
    name: "BELTS AND TENSIONER",
    icon: "package",
    catalogCategories: [],
  },
  {
    id: "cat-5",
    name: "BODY PARTS",
    icon: "body",
    catalogCategories: ["Body Parts"],
  },
  {
    id: "cat-6",
    name: "BRAKE SYSTEM",
    icon: "brake",
    catalogCategories: ["Brake Pads"],
  },
  {
    id: "cat-7",
    name: "CABLES AND WIRES",
    icon: "cable",
    catalogCategories: [],
  },
  { id: "cat-8", name: "CHILD PARTS", icon: "wrench", catalogCategories: [] },
  {
    id: "cat-9",
    name: "CLUTCH SYSTEM",
    icon: "bearing",
    catalogCategories: ["Clutch"],
  },
  {
    id: "cat-10",
    name: "ELECTRICALS AND ELECTRONIC",
    icon: "electric",
    catalogCategories: [],
  },
  {
    id: "cat-11",
    name: "ENGINE",
    icon: "bearing",
    catalogCategories: ["Engine Oil"],
  },
  {
    id: "cat-12",
    name: "FILTERS",
    icon: "filter",
    catalogCategories: ["Filters"],
  },
  {
    id: "cat-13",
    name: "FLUIDS COOLANT AND GREASE",
    icon: "fluid",
    catalogCategories: [],
  },
  { id: "cat-14", name: "FUEL SYSTEM", icon: "fuel", catalogCategories: [] },
  { id: "cat-15", name: "GLASS", icon: "glass", catalogCategories: [] },
  { id: "cat-16", name: "HORNS", icon: "horn", catalogCategories: [] },
  { id: "cat-17", name: "HVAC/THERMAL", icon: "hvac", catalogCategories: [] },
  {
    id: "cat-18",
    name: "LIGHTING",
    icon: "lighting",
    catalogCategories: ["Headlights"],
  },
]);

export const PARTS_SUB_CATEGORIES = Object.freeze([
  { id: "sub-1", name: "BALL BEARING", categoryId: "cat-3", icon: "bearing" },
  { id: "sub-4", name: "WHEEL BEARING", categoryId: "cat-3", icon: "bearing" },
  { id: "sub-2", name: "BRAKE HOSE", categoryId: "cat-6", icon: "cable" },
  { id: "sub-3", name: "BRAKE PAD", categoryId: "cat-6", icon: "package" },
  { id: "sub-5", name: "WHEEL CYLINDER", categoryId: "cat-6", icon: "brake" },
  { id: "sub-6", name: "Oil Filter", categoryId: "cat-12", icon: "package" },
  { id: "sub-7", name: "Fuel Filter", categoryId: "cat-12", icon: "package" },
]);
