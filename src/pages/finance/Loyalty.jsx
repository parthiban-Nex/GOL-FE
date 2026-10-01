import { useMemo, useState } from "react";
import clsx from "clsx";
import { Star, ChevronLeft } from "lucide-react";
import Card from "@/components/ui/Card";
import {
  TIERS,
  MILESTONE_TIER_KEYS,
  LOYALTY_SUMMARY,
  MONTHLY_PROGRESS,
  YEAR_PROGRESS,
  MONTHLY_PERFORMANCE,
  UNLOCK_CHALLENGES,
} from "@/pages/finance/mockLoyalty";
import {
  bronzeBadge,
  silverBadge,
  goldBadge,
  platinumBadge,
  coinIcon,
  insuranceCard,
  jobcardCompletionCard,
  rsaCard,
} from "@/assets/images";

const TIER_BY_KEY = Object.fromEntries(TIERS.map((t) => [t.key, t]));

// Real badge artwork per tier. Only bronze/silver/gold/platinum have
// supplied artwork - any other tier key (e.g. "elite") falls back to
// the CSS medallion further down so nothing breaks if it shows up.
const TIER_BADGE_IMG = {
  bronze: bronzeBadge,
  silver: silverBadge,
  gold: goldBadge,
  platinum: platinumBadge,
};

// Palette used only for the CSS fallback medallion (tiers with no
// supplied artwork) and for tier-colored text/labels.
const TIER_PALETTE = {
  bronze: {
    from: "from-amber-700",
    to: "to-amber-500",
    ring: "ring-amber-300/40",
    text: "text-amber-700",
    chartBar: "fill-amber-500",
  },
  silver: {
    from: "from-slate-400",
    to: "to-slate-200",
    ring: "ring-slate-300/40",
    text: "text-slate-500",
    chartBar: "fill-slate-300",
  },
  gold: {
    from: "from-yellow-400",
    to: "to-amber-500",
    ring: "ring-amber-300/40",
    text: "text-amber-500",
    chartBar: "fill-amber-500",
  },
  platinum: {
    from: "from-slate-500",
    to: "to-slate-300",
    ring: "ring-slate-400/40",
    text: "text-slate-500",
    chartBar: "fill-slate-400",
  },
  elite: {
    from: "from-violet-500",
    to: "to-fuchsia-400",
    ring: "ring-violet-300/40",
    text: "text-violet-500",
    chartBar: "fill-violet-500",
  },
};

/**
 * Finance > Loyalty. Rich single-page dashboard - four sections:
 *   1. Next Tiers & Milestones (medallion row + current-tier sidebar)
 *   2. 6-Months Progress chart + Monthly Performance sidebar
 *   3. Unlock More Coins (three promotional cards)
 *
 * All state is local + read from mock data. When the backend is live
 * swap each `useState(...)` initializer for a `loyaltyApi.*` call in
 * a `useEffect`; the shape of the objects is identical.
 */
export default function Loyalty() {
  const [rangeTab, setRangeTab] = useState("6M"); // 6M | 1Y
  const chartData = rangeTab === "6M" ? MONTHLY_PROGRESS : YEAR_PROGRESS;

  const summary = LOYALTY_SUMMARY;
  const currentTier = TIER_BY_KEY[summary.currentTierKey];
  const nextTier =
    TIERS[TIERS.findIndex((t) => t.key === summary.currentTierKey) + 1] ?? null;
  const coinsToNextTier = nextTier
    ? Math.max(0, nextTier.coinsRequired - summary.currentCoins)
    : 0;

  return (
    <div className="space-y-4 bg">
      <h1 className="text-lg font-semibold text-ink-800">Loyalty</h1>

      <TiersMilestonesCard
        summary={summary}
        currentTier={currentTier}
        nextTier={nextTier}
        coinsToNextTier={coinsToNextTier}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ProgressChartCard
          data={chartData}
          rangeTab={rangeTab}
          onRangeChange={setRangeTab}
        />
        <MonthlyPerformanceCard performance={MONTHLY_PERFORMANCE} />
      </div>

      <UnlockMoreCoinsSection challenges={challenges} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section 1 — Next Tiers & Milestones
 * ──────────────────────────────────────────────────────────────────── */

function TiersMilestonesCard({
  summary,
  currentTier,
  nextTier,
  coinsToNextTier,
}) {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* Left: milestones */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold uppercase  text-ink-800">
              Next Tiers &amp; Milestones
            </h2>
            {nextTier && (
              <p className="text-md font-semibold text-ink-800">
                Need{" "}
                <span className="font-bold text-brand-500 text-lg">
                  {coinsToNextTier.toLocaleString("en-IN")}
                </span>{" "}
                More Coins to Upgrade to {nextTier.label} Partner
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 px-10">
            {MILESTONE_TIER_KEYS.map((key, i) => {
              const tier = TIER_BY_KEY[key];
              const achieved = summary.currentCoins >= tier.coinsRequired;
              const remaining = tier.coinsRequired - summary.currentCoins;
              return (
                <div
                  key={key}
                  className="flex flex-1 items-center last:flex-none"
                >
                  <MilestoneMedallion
                    tier={tier}
                    achieved={achieved}
                    remaining={remaining}
                  />
                  {i < MILESTONE_TIER_KEYS.length - 1 && (
                    <div className="flex flex-1 items-center justify-center">
                      <span
                        className="relative mx-1 hidden w-18 shrink-0 sm:block"
                        aria-hidden
                      >
                        <span className="absolute left-0 right-0 -top-9 border-t border-ink-300" />
                        <span className="absolute -left-[3px] -top-9 h-1 w-1 -translate-y-1/2 rotate-45 bg-ink-500" />
                        <span className="absolute -right-[3px] -top-9 h-1 w-1 -translate-y-1/2 rotate-45 bg-ink-500" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Current tier sidebar */}
        <div className="border-t border-dashed border-ink-200 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <p className="mb-3 text-lg font-bold text-ink-800">Current Tier</p>
          <div className="mb-2.5 flex items-center gap-2.5 rounded-[26px] bg-gradient-to-b from-white to-[#e7e7e7] px-3.5 py-4 shadow-[inset_0_1px_12px_rgba(177,174,174,0.25)]">
            <div className="flex items-center gap-3">
              <TierMedallion tier={currentTier} size={64} />
              <div>
                <p
                  className={clsx(
                    "text-2xl font-bold uppercase leading-none",
                    TIER_PALETTE[currentTier.key].text,
                  )}
                >
                  {currentTier.label}
                </p>
                <p className="mt-1 text-[11px] text-ink-500">
                  Great! Keep Earning
                  <br />
                  to unlock higher tiers
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 box-border flex h-16 max-w-full flex-row items-center gap-2.5 rounded-[26px] bg-gradient-to-b from-white/20 to-[#e7e7e7]/20 px-3.5 py-2 text-[20px] font-extrabold text-slate-800 shadow-[inset_0_1px_12px_rgba(177,174,174,0.25)]">
            <div className="flex items-center gap-3">
              <img
                src={coinIcon}
                alt=""
                className="h-9 w-9 shrink-0 drop-shadow"
              />
              <p className="text-2xl font-bold text-ink-800">
                {summary.coinsEarnedThisMonth.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <p className="mt-2 text-md font-medium text-ink-800 text-left">
            Total Coins Earned This Month
          </p>
        </div>
      </div>
    </Card>
  );
}

function MilestoneMedallion({ tier, achieved, remaining }) {
  return (
    <div className="flex min-w-0 flex-col items-center">
      <span className="mb-1 text-xs font-semibold text-brand-600 h-4">
        {tier.pointsMultiplier ? `${tier.pointsMultiplier} points` : "\u00A0"}
      </span>
      <TierMedallion tier={tier} size={72} />
      <p className="mt-2 text-sm font-semibold text-ink-800">{tier.label}</p>
      <p className="text-sm font-bold text-ink-800">
        {tier.coinsRequired.toLocaleString("en-IN")}
      </p>
      <div className="mt-2">
        {achieved ? (
          <span className="inline-block rounded-md bg-emerald-500 px-4 py-1 text-base font-semibold text-white">
            Achieved
          </span>
        ) : (
          <span className="inline-block rounded-md border border-slate-200 bg-[#fdfdfd] px-2.5 py-1 text-base font-semibold text-black whitespace-nowrap">
            {remaining.toLocaleString("en-IN")} to go
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Tier medallion. Uses the real badge artwork when we have it
 * (bronze/silver/gold/platinum); falls back to the old CSS gradient
 * + star medallion for any tier without supplied artwork (e.g. elite),
 * so the component never breaks if a new tier is added.
 */
function TierMedallion({ tier, size = 72 }) {
  const badgeSrc = TIER_BADGE_IMG[tier.key];

  if (badgeSrc) {
    return (
      <img
        src={badgeSrc}
        alt={`${tier.label} tier badge`}
        style={{ width: size, height: size }}
        className="shrink-0 object-contain drop-shadow-md"
      />
    );
  }

  // Fallback CSS medallion for tiers with no artwork yet.
  const palette = TIER_PALETTE[tier.key] ?? TIER_PALETTE.bronze;
  return (
    <div
      className={clsx(
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-md ring-4",
        palette.from,
        palette.to,
        palette.ring,
      )}
      style={{ width: size, height: size }}
      aria-label={`${tier.label} tier medallion`}
    >
      <Star
        className="text-white drop-shadow"
        style={{ width: size * 0.42, height: size * 0.42 }}
        fill="currentColor"
        strokeWidth={0}
      />
      <div
        className={clsx(
          "absolute -bottom-1 h-2 rounded-b-md bg-gradient-to-r",
          palette.from,
          palette.to,
        )}
        style={{ width: size * 0.5 }}
        aria-hidden
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section 2 — 6-Months Progress chart
 * ──────────────────────────────────────────────────────────────────── */

function ProgressChartCard({ data, rangeTab, onRangeChange }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-800">
          {rangeTab === "6M" ? "6 Months Progress" : "This Year Progress"}
        </h2>
        <div className="inline-flex overflow-hidden gap-2 rounded-lg ">
          {[
            { key: "6M", label: "Last 6 Months" },
            { key: "1Y", label: "This Year" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onRangeChange(t.key)}
              className={clsx(
                "rounded-md px-3.5 cursor-pointer py-1.5 text-sm font-semibold transition-colors",
                rangeTab === t.key
                  ? "bg-brand-600 text-white"
                  : "text-ink-600 bg-ink-100",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px]">
        <ChartArea data={data} />
        <TierLegend />
      </div>
    </Card>
  );
}

function ChartArea({ data }) {
  // Fixed viewBox dimensions - the SVG scales to fit its container.
  const W = 620;
  const H = 260;
  const padX = 40;
  const padY = 30;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const maxCoins = 100000; // matches the Elite tier ceiling on the axis
  const barWidth = Math.min(48, (innerW / data.length) * 0.55);
  const gapX = innerW / data.length;

  const yTicks = [0, 20000, 40000, 60000, 80000, 100000];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[520px] w-full">
        {/* Y-axis gridlines + labels */}
        {yTicks.map((v) => {
          const y = padY + innerH - (v / maxCoins) * innerH;
          return (
            <g key={v}>
              <line
                x1={padX}
                x2={W - padX}
                y1={y}
                y2={y}
                className="stroke-ink-100"
                strokeDasharray="2 4"
              />
              <text
                x={padX - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-ink-400 text-[10px]"
              >
                {v === 0 ? "0" : `${v / 1000}K`}
              </text>
            </g>
          );
        })}

        {/* Bars + labels + tier badges */}
        {data.map((d, i) => {
          const palette = TIER_PALETTE[d.tier] ?? TIER_PALETTE.bronze;
          const barH = (d.coins / maxCoins) * innerH;
          const x = padX + gapX * i + (gapX - barWidth) / 2;
          const y = padY + innerH - barH;
          const isCurrent = Boolean(d.current);
          return (
            <g key={d.month}>
              {/* Coin count label above the bar */}
              <text
                x={x + barWidth / 2}
                y={y - 26}
                textAnchor="middle"
                className="fill-ink-800 text-[11px] font-semibold "
              >
                {d.coins.toLocaleString("en-IN")}
              </text>

              {/* Mini tier badge above the bar - real artwork when we have
                  it for this tier, CSS circle+star fallback otherwise */}
              {TIER_BADGE_IMG[d.tier] ? (
                <image
                  href={TIER_BADGE_IMG[d.tier]}
                  x={x + barWidth / 2 - 9}
                  y={y - 25}
                  width="18"
                  height="18"
                  preserveAspectRatio="xMidYMid meet"
                />
              ) : (
                <g transform={`translate(${x + barWidth / 2 - 8}, ${y - 20})`}>
                  <circle
                    cx="8"
                    cy="8"
                    r="7.5"
                    className={clsx(
                      isCurrent ? "fill-amber-500" : palette.chartBar,
                    )}
                  />
                  <text
                    x="8"
                    y="11"
                    textAnchor="middle"
                    className="fill-white text-[8px] font-bold"
                  >
                    ★
                  </text>
                </g>
              )}

              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="4"
                className={clsx(
                  isCurrent
                    ? "fill-amber-400"
                    : d.tier === "bronze"
                      ? "fill-amber-600/40"
                      : d.tier === "silver"
                        ? "fill-slate-200"
                        : d.tier === "gold"
                          ? "fill-amber-300"
                          : d.tier === "platinum"
                            ? "fill-slate-300"
                            : "fill-violet-300",
                )}
              />

              {/* X-axis month label */}
              <text
                x={x + barWidth / 2}
                y={H - 6}
                textAnchor="middle"
                className={clsx(
                  "text-[11px]",
                  isCurrent ? "fill-amber-600 font-semibold" : "fill-ink-500",
                )}
              >
                {d.month}
                {isCurrent ? " (Current)" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TierLegend() {
  // Mirror ChartArea's geometry so each legend row lines up with where
  // that coin value would sit on the chart's own y-axis (this is why
  // Silver/Bronze bunch together near the bottom while Elite/Platinum/
  // Gold sit further apart near the top - same as the reference).
  const CHART_H = 260;
  const PAD_Y = 30;
  const INNER_H = CHART_H - PAD_Y * 2;
  const MAX_COINS = 100000;

  const legend = [
    {
      label: "Elite",
      coins: "1,00,000+",
      value: 100000,
      tone: "text-blue-900",
    },
    {
      label: "Platinum",
      coins: "80,000",
      value: 80000,
      tone: "text-slate-500",
    },
    { label: "Gold", coins: "60,000", value: 60000, tone: "text-amber-500" },
    { label: "Silver", coins: "30,000", value: 30000, tone: "text-slate-500" },
    { label: "Bronze", coins: "2,000", value: 2000, tone: "text-orange-800" },
  ];

  return (
    <div className="relative h-full min-h-[200px] text-xs">
      {legend.map((l) => {
        const y = PAD_Y + INNER_H - (l.value / MAX_COINS) * INNER_H;
        const topPct = (y / CHART_H) * 100;
        return (
          <div
            key={l.label}
            className="absolute left-0 flex -translate-y-1/2 flex-col leading-tight"
            style={{ top: `${topPct}%` }}
          >
            <span className={clsx("font-semibold", l.tone)}>{l.label}</span>
            <span className="text-ink-800 font-medium">{l.coins}</span>
          </div>
        );
      })}
    </div>
  );
}
/* ────────────────────────────────────────────────────────────────────
 * Section 2b — Monthly Performance sidebar
 * ──────────────────────────────────────────────────────────────────── */

function MonthlyPerformanceCard({ performance }) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-base font-semibold text-ink-800">
            Monthly Performance
          </p>
          <p className="text-xs text-ink-500">Purchase Achievement</p>
        </div>
      </div>

      <dl className="space-y-3 pt-2 text-sm">
        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
          <dt className="text-ink-700">Current Purchase Value</dt>
          <dd className="font-bold text-ink-800">
            ₹{performance.purchaseValue.toLocaleString("en-IN")}
          </dd>
        </div>
        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
          <dt className="text-ink-600">Current Tier</dt>
          <dd className="font-bold text-amber-500">
            {performance.currentTier}
          </dd>
        </div>
        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
          <dt className="text-ink-600">Next Tier</dt>
          <dd className="font-bold text-ink-800">{performance.nextTier}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-ink-600">Amount Required</dt>
          <dd className="font-bold text-ink-800">
            ₹{performance.amountRequired.toLocaleString("en-IN")}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section 3 — Unlock More Coins (3 promotional cards)
 * ──────────────────────────────────────────────────────────────────── */

const CHALLENGE_THEME = {
  navy: {
    badge: "text-[#ffffff]",
  },
  blue: {
    badge: "text-[#0B2B94]",
  },
  orange: {
    badge: "text-[#703613]",
  },
};
// Background image per challenge id
const CHALLENGE_BG = {
  insurance: insuranceCard,
  jobcard: jobcardCompletionCard,
  rsa: rsaCard,
};

// Your challenge data — theme + id drive both bg and text color

const challenges = [
  {
    id: "insurance",
    theme: "navy",
    coins: 2000,
    description:
      "Complete 3 successful insurance sales and get rewarded instantly.",
  },
  {
    id: "jobcard",
    theme: "blue",
    coins: 1500,
    description: "Every completed job card brings you closer to your reward.",
  },
  {
    id: "rsa",
    theme: "orange",
    coins: 1500,
    description: "Complete the challenge and grow your loyalty rewards.",
  },
];
function UnlockMoreCoinsSection({ challenges }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-ink-800">
        Unlock More Coins
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c) => (
          <UnlockChallengeCard key={c.id} challenge={c} />
        ))}
      </div>
    </Card>
  );
}
function UnlockChallengeCard({ challenge }) {
  const theme = CHALLENGE_THEME[challenge.theme] ?? CHALLENGE_THEME.blue;
  const bgSrc = CHALLENGE_BG[challenge.id];

  return (
    <div
      className="relative flex min-h-[180px] items-center rounded-4xl p-5 shadow-card"
      style={
        bgSrc
          ? {
              backgroundImage: `url(${bgSrc})`,
              backgroundSize: "100% 100%",
            }
          : undefined
      }
    >
      <div className="relative z-10 max-w-[70%]">
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold shadow-sm",
            theme.badge,
          )}
        >
          Earn <img src={coinIcon} alt="" className="h-3.5 w-3.5" />
          {challenge.coins.toLocaleString("en-IN")} Coins
        </span>
        <p
          className={clsx(
            "mt-4 text-sm leading-snug font-medium w-3/4",
            theme.badge,
          )}
        >
          {challenge.description}
        </p>
      </div>
    </div>
  );
}
