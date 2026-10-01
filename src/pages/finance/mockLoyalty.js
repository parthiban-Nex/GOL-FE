/**
 * Mock data for Finance > Loyalty. Shape mirrors what the eventual
 * loyaltyApi will return so switching to a real backend is a one-line
 * change per state selector inside pages/finance/Loyalty.jsx.
 */

// ─── Tier ladder (Bronze → Silver → Gold → Platinum → Elite) ─────────────
// `coinsRequired` is the coin balance needed to unlock that tier.
// `pointsMultiplier` is what appears above each medallion in the header
// (Silver = 1.5X, Gold = 1.75X, Platinum = 2X, Elite = 2.5X). Bronze
// is the entry tier and has no multiplier label in the reference.
export const TIERS = [
  { key: "bronze",   label: "Bronze",   coinsRequired:   2000, pointsMultiplier: null },
  { key: "silver",   label: "Silver",   coinsRequired:  30000, pointsMultiplier: "1.5X" },
  { key: "gold",     label: "Gold",     coinsRequired:  60000, pointsMultiplier: "1.75X" },
  { key: "platinum", label: "Platinum", coinsRequired:  80000, pointsMultiplier: "2X" },
  { key: "elite",    label: "Elite",    coinsRequired: 100000, pointsMultiplier: "2.5X" },
];

// The four tiers shown in the milestone header row. Elite is a
// chart-only reference tier and not part of the milestone medallions.
export const MILESTONE_TIER_KEYS = ["bronze", "silver", "gold", "platinum"];

// ─── Current garage status ───────────────────────────────────────────────
export const LOYALTY_SUMMARY = {
  currentTierKey: "gold",
  currentCoins: 62000,           // lifetime / ladder position
  coinsEarnedThisMonth: 18500,   // used by "Current Tier" card sidebar
};

// ─── 6-month coin history ───────────────────────────────────────────────
// `tier` names the badge that appeared above the bar that month (i.e.
// the tier reached at that point). `current` flags the active month
// so the chart can highlight it in accent orange.
export const MONTHLY_PROGRESS = [
  { month: "Nov", coins:  2200, tier: "bronze" },
  { month: "Dec", coins: 32000, tier: "silver" },
  { month: "Jan", coins: 44000, tier: "silver" },
  { month: "Feb", coins: 52000, tier: "silver" },
  { month: "Mar", coins: 58000, tier: "silver" },
  { month: "Apr", coins: 62000, tier: "gold", current: true },
];

// Placeholder longer series used when the user picks "This Year".
export const YEAR_PROGRESS = [
  { month: "May", coins:  1800, tier: "bronze" },
  { month: "Jun", coins:  4200, tier: "bronze" },
  { month: "Jul", coins: 12500, tier: "bronze" },
  { month: "Aug", coins: 22000, tier: "bronze" },
  { month: "Sep", coins: 28500, tier: "bronze" },
  { month: "Oct", coins: 31000, tier: "silver" },
  { month: "Nov", coins:  2200, tier: "bronze" },
  { month: "Dec", coins: 32000, tier: "silver" },
  { month: "Jan", coins: 44000, tier: "silver" },
  { month: "Feb", coins: 52000, tier: "silver" },
  { month: "Mar", coins: 58000, tier: "silver" },
  { month: "Apr", coins: 62000, tier: "gold", current: true },
];

// ─── Monthly Performance (right sidebar card) ────────────────────────────
export const MONTHLY_PERFORMANCE = {
  purchaseValue: 82000,
  currentTier: "Gold",
  nextTier: "Platinum",
  amountRequired: 18000,
};

// ─── Unlock More Coins - promotional challenge cards ─────────────────────
// `theme` picks the card background gradient inside <UnlockChallengeCard/>.
// Kept as three fixed entries (mirrors reference); when the backend is
// live, this is a `/loyalty/challenges` GET.
export const UNLOCK_CHALLENGES = [
  {
    id: "insurance",
    title: "Insurance Policy",
    coins: 2000,
    description: "Complete 3 successful insurance sales and get rewarded instantly.",
    theme: "navy",
  },
  {
    id: "jobcard",
    title: "Jobcard Completion",
    coins: 1500,
    description: "Every completed job card brings you closer to your reward.",
    theme: "blue",
  },
  {
    id: "rsa",
    title: "RSA Roadside Assistance",
    coins: 1500,
    description: "Complete the challenge and grow your loyalty rewards.",
    theme: "orange",
  },
];