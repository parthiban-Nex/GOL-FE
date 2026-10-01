import { useState } from "react";
import clsx from "clsx";
import {
  IndianRupee,
  Sparkles,
  Boxes,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Award,
  Gift,
} from "lucide-react";
import {
  mech,
  sales,
  body,
  insurancePos,
  rsaPos,
  delivered,
  deliveredJobcards,
  intransist,
  labourValues,
  partsAvailability,
  partsOrders,
  partsValues,
} from "@/assets/images";
import Card from "@/components/ui/Card";
import {
  DashboardAnalyticsProvider,
  useDashboardData,
  formatCompact,
} from "@/hooks/useDashboardAnalytics";
import Select from "@/components/ui/Select";
import {
  AreaChart,
  GroupedBarChart,
  StackedBarChart,
  DonutChart,
  MiniBarPair,
} from "@/components/analytics/AnalyticsCharts";

import {
  TOP_STATS,
  REVENUE_CARDS,
  TECHNICIAN_ROWS,
  SERVICE_ADVISOR_ROWS,
  BRAND_WISE_ROWS,
  PARTS_CATEGORY_ROWS,
  VALUES_METRIC_ROWS,
  VALUES_METRIC_TOTAL,
  INVENTORY_METRIC_ROWS,
  INVENTORY_METRIC_FOOTER,
  STATUS_CARDS,
} from "./mockAnalytics";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const YEARS = ["2024", "2025", "2026", "2027"];


export default function Dashboard() {
  return (
    <DashboardAnalyticsProvider>
      <div className="space-y-6">
        <WelcomeAndStats />
        <RevenueSection />
        <PerformanceSection />
        <InventorySection />
        <OtherStatsSection />
      </div>
    </DashboardAnalyticsProvider>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section 1 - Welcome + 4 top stat pills
 * STILL MOCK: no backend endpoint for today's delivery, reminders,
 * parts order/arrival, or CARPM counts.
 * ──────────────────────────────────────────────────────────────────── */

function WelcomeAndStats() {
  const { raw } = useDashboardData();
  // dashboard_revenue returns outletName - the one real value in this
  // section - everything else here is still mock (see note above).
  const outletName = raw?.revenue?.outletName ?? "Auto Garage";

  return (
    <>
      <h1 className="text-2xl font-bold text-ink-800">Welcome, {outletName}</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TopStatCard
          title="Todays Delivery"
          tone="orange"
          content={
            <p className="text-3xl font-bold text-white">
              {TOP_STATS.todaysDelivery.value}
            </p>
          }
        />
        <TopStatCard
          title="Reminders"
          tone="blue"
          content={
            <div className="grid grid-cols-2 ">
              <SubStat
                label="Booking"
                value={String(TOP_STATS.reminders.booking).padStart(2, "0")}
              />
              <SubStat
                label="Insurance"
                value={String(TOP_STATS.reminders.insurance).padStart(2, "0")}
              />
            </div>
          }
        />
        <TopStatCard
          title="Parts"
          tone="cyan"
          content={
            <div className="grid grid-cols-2 gap-3">
              <SubStat
                label="Order"
                value={String(TOP_STATS.parts.order).padStart(2, "0")}
              />
              <SubStat
                label="Arrival"
                value={String(TOP_STATS.parts.arrival).padStart(2, "0")}
              />
            </div>
          }
        />
        <TopStatCard
          title="CARPM"
          tone="red"
          content={
            <div className="grid grid-cols-2 gap-3">
              <SubStat
                label="Diagnosis"
                value={String(TOP_STATS.carpm.diagnosis).padStart(2, "0")}
              />
              <SubStat
                label="Alerts"
                value={String(TOP_STATS.carpm.alerts).padStart(2, "0")}
              />
            </div>
          }
        />
      </div>
    </>
  );
}

function TopStatCard({ title, tone, content }) {
  const tones = {
    orange: "bg-accent-500",
    blue: "bg-brand-600",
    cyan: "bg-cyan-500",
    red: "bg-red-500",
  }[tone];
  return (
    <div className={clsx("rounded-2xl p-5 text-white shadow-card", tones)}>
      <p className="mb-3 text-lg font-bold">{title}</p>
      {content}
    </div>
  );
}

function SubStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-white/80">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section 2 - Revenue & Loyalty Points
 * REAL: Sales Turnover / Mech / Body cards, from POST
 * /jobCard/dashboard_revenue - no mock fallback.
 * STILL MOCK: Loyalty Points, My Offers - no backend endpoint.
 * ──────────────────────────────────────────────────────────────────── */

function RevenueSection() {
  const [month, setMonth] = useState("Jan");
  const [year, setYear] = useState("2026");

  const { revenueCards, isLoading } = useDashboardData();

  const cards = revenueCards
    ? [
        {
          title: "Sales Turnover",
          tone: "lightBlue",
          image: sales,
          mtd: revenueCards.salesTurnover.mtd,
          ytd: revenueCards.salesTurnover.ytd,
        },
        {
          title: "Mech Shop Performance",
          tone: "red",
          image: mech,
          mtd: revenueCards.mechShopPerformance.mtd,
          ytd: revenueCards.mechShopPerformance.ytd,
        },
        {
          title: "Body Shop Performance",
          tone: "orange",
          image: body,
          mtd: revenueCards.bodyShopPerformance.mtd,
          ytd: revenueCards.bodyShopPerformance.ytd,
        },
      ]
    : [];

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={IndianRupee}
        iconTone="emerald"
        title="Revenue & Loyalty Points"
        right={
          <MonthYearPicker
            month={month}
            year={year}
            onMonth={setMonth}
            onYear={setYear}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.length > 0
          ? cards.map((c) => <RevenuePerformanceCard key={c.title} {...c} />)
          : Array.from({ length: 3 }).map((_, i) => (
              <RevenueCardSkeleton key={i} loading={isLoading} />
            ))}
        <SolidRevenueCard
          title="Loyalty Points"
          tone="blue"
          icon={Award}
          value={REVENUE_CARDS.loyaltyPoints.value}
        />
        <SolidRevenueCard
          title="My Offers"
          tone="navy"
          icon={Gift}
          value={REVENUE_CARDS.myOffers.value}
          badge="Coming Soon"
        />
      </div>
    </section>
  );
}

function RevenuePerformanceCard({ title, tone, image, mtd, ytd }) {
  const tones = {
    lightBlue: "bg-brand-500",
    red: "bg-red-500",
    orange: "bg-accent-500",
  }[tone];

  return (
    <div
      className={clsx(
        "relative overflow-hidden text-white rounded-2xl p-4 shadow-card",
        tones,
      )}
    >
      <p className="text-md font-medium">{title}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <img src={image} alt={title} className="h-14 w-14 shrink-0" />
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm font-medium">
            <p className="opacity-90">MTD</p>
            <p className="text-2xl font-bold">
              {mtd} <span className="text-[12px] font-medium">Lakhs</span>
            </p>
          </div>
          <div className="text-sm font-medium">
            <p className="opacity-90">YTD</p>
            <p className="text-2xl font-bold">
              {ytd} <span className="text-[12px] font-medium">Lakhs</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shown in place of a RevenuePerformanceCard while loading or if the
 * revenue call failed - no mock numbers stand in for this panel. */
function RevenueCardSkeleton({ loading }) {
  return (
    <div className="rounded-2xl bg-ink-100 p-4 shadow-card animate-pulse">
      <div className="h-4 w-24 rounded bg-ink-200" />
      <div className="mt-6 h-8 w-32 rounded bg-ink-200" />
      {!loading && (
        <p className="mt-2 text-[11px] text-ink-400">Couldn't load</p>
      )}
    </div>
  );
}

function SolidRevenueCard({ title, tone, icon: Icon, value, badge }) {
  const tones = {
    blue: " text-white",
    navy: " text-white",
  }[tone];
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-brand-700 p-5 shadow-card",
        tones,
      )}
    >
      {badge && (
        <span className="absolute left-2 top-1 rounded-md bg-emerald-400 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-900">
          {badge}
        </span>
      )}
      <div className="mb-3 flex items-start justify-between">
        <p className="text-3xl font-bold">{value}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-sm font-medium text-white/85">{title}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section 3 - Performance Details (6-chart grid)
 * REAL, no mock fallback: EPRO Trend, Vehicles, Mech/Body,
 * Labour/Parts, New Vs Repeat, Purchase from myTVS - all six confirmed
 * against live responses.
 * ──────────────────────────────────────────────────────────────────── */

function ControlledSelect({ value, options, onChange, loading, placeholder }) {
  return (
    <div className="relative w-28">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        
      </Select>
    </div>
  );
}

function PerformanceSection() {
  const [month, setMonth] = useState("Jan");
  const [year, setYear] = useState("2026");

  const {
    eproSeries,
    eproShopType,
    setEproShopType,
    eproOption,
    setEproOption,

    vehicleFlow,
    sourceTypeOptions,
    vehicleSourceTypeId,
    setVehicleSourceTypeId,
    vehicleFlowDirection,
    setVehicleFlowDirection,
    vehiclePeriod,
    setVehiclePeriod,
    isVehicleFlowLoading,

    mechBody,
    mechBodyOption,
    setMechBodyOption,

    labourPartsSeries,
    labourPartsOption,
    setLabourPartsOption,

    newVsRepeat,
    newVsRepeatOption,
    setNewVsRepeatOption,

    purchaseTrend,
    purchaseOption,
    setPurchaseOption,
  } = useDashboardData();

  const periodOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "q1", label: "Q1" },
    { value: "q2", label: "Q2" },
    { value: "q3", label: "Q3" },
    { value: "q4", label: "Q4" },
    { value: "halfyearly", label: "Half Yearly" },
    { value: "yearly", label: "Yearly" },
    { value: "preyear", label: "Previous Year" },
  ];

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={Sparkles}
        iconTone="emerald"
        title="Performance Details"
        right={
          <MonthYearPicker
            month={month}
            year={year}
            onMonth={setMonth}
            onYear={setYear}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartPanel
          title="EPRO Trend"
          filters={[
            <ControlledSelect
              key="eproType"
              value={eproShopType}
              options={[
                { value: "Mech", label: "Mech" },
                { value: "Body", label: "Body" },
              ]}
              onChange={setEproShopType}
            />,
            <ControlledSelect
              key="eproOption"
              value={eproOption}
              options={periodOptions}
              onChange={setEproOption}
            />,
          ]}
        >
          {eproSeries.values.length ? (
            <AreaChart
              months={eproSeries.labels}
              values={eproSeries.values}
              highlight={eproSeries.highlight}
              tone="brand"
            />
          ) : (
            <ChartEmptyState />
          )}
        </ChartPanel>

        <ChartPanel
          title="Vehicles"
          filters={[
            <ControlledSelect
              key="vehicleSource"
              value={vehicleSourceTypeId}
              options={sourceTypeOptions}
              onChange={setVehicleSourceTypeId}
              loading={isVehicleFlowLoading}
              placeholder="All Sources"
            />,
            <ControlledSelect
              key="vehicleFlow"
              value={vehicleFlowDirection}
              options={[
                { value: "Inflow", label: "Inflow" },
                { value: "Outflow", label: "Outflow" },
              ]}
              onChange={setVehicleFlowDirection}
            />,
            <ControlledSelect
              key="vehiclePeriod"
              value={vehiclePeriod}
              options={periodOptions}
              onChange={setVehiclePeriod}
            />,
          ]}
          legend={[
            { dot: "bg-brand-600", label: "Mech" },
            { dot: "bg-accent-500", label: "Body" },
          ]}
        >
          {vehicleFlow ? (
            <GroupedBarChart
              labels={vehicleFlow.labels}
              series={[
                { values: vehicleFlow.mech, color: "fill-brand-600" },
                { values: vehicleFlow.body, color: "fill-accent-500" },
              ]}
              sharedScale
            />
          ) : (
            <ChartEmptyState />
          )}
        </ChartPanel>

        <ChartPanel
          title="Mech/ Body"
          filters={[
            <ControlledSelect
              key="mechBodyOption"
              value={mechBodyOption}
              options={periodOptions}
              onChange={setMechBodyOption}
            />,
          ]}
          legend={[
            { dot: "bg-brand-600", label: "Mech" },
            { dot: "bg-accent-500", label: "Body" },
          ]}
        >
          {mechBody ? (
            <GroupedBarChart
              labels={["MTD", "YTD"]}
              series={[
                {
                  values: [mechBody.mtd[0], mechBody.ytd[0]],
                  color: "fill-brand-600",
                },
                {
                  values: [mechBody.mtd[1], mechBody.ytd[1]],
                  color: "fill-accent-500",
                },
              ]}
            />
          ) : (
            <ChartEmptyState />
          )}
        </ChartPanel>

        <ChartPanel
          title="Labour/ Parts"
          filters={[
            <ControlledSelect
              key="labourPartsOption"
              value={labourPartsOption}
              options={periodOptions}
              onChange={setLabourPartsOption}
            />,
          ]}
          legend={[
            { dot: "bg-cyan-500", label: "Labour" },
            { dot: "bg-violet-500", label: "Parts" },
          ]}
        >
          {labourPartsSeries ? (
            <StackedBarChart
              labels={labourPartsSeries.labels}
              series={[
                { values: labourPartsSeries.parts, color: "fill-violet-500" },
                { values: labourPartsSeries.labour, color: "fill-cyan-500" },
              ]}
            />
          ) : (
            <ChartEmptyState />
          )}
        </ChartPanel>

        <ChartPanel
          title="New Vs Repeat"
          filters={[
            <ControlledSelect
              key="newVsRepeatOption"
              value={newVsRepeatOption}
              options={periodOptions}
              onChange={setNewVsRepeatOption}
            />,
          ]}
          legend={[
            { dot: "bg-brand-600", label: "New" },
            { dot: "bg-accent-500", label: "Repeat" },
          ]}
        >
          {newVsRepeat ? (
            <DonutChart
              segments={[
                { value: newVsRepeat.newCount, color: "stroke-accent-500" },
                { value: newVsRepeat.repeatCount, color: "stroke-brand-600" },
              ]}
            />
          ) : (
            <ChartEmptyState />
          )}
        </ChartPanel>

        <ChartPanel
          title="Purchase from myTVS"
          filters={[
            <ControlledSelect
              key="purchaseOption"
              value={purchaseOption}
              options={periodOptions}
              onChange={setPurchaseOption}
            />,
          ]}
        >
          {purchaseTrend.values.length ? (
            <AreaChart
              months={purchaseTrend.labels}
              values={purchaseTrend.values}
              highlight={purchaseTrend.highlight}
              tone="brand"
            />
          ) : (
            <ChartEmptyState />
          )}
        </ChartPanel>
      </div>
    </section>
  );
}

/** Shown instead of a chart when its endpoint hasn't returned data yet
 * (still loading) or came back empty/failed. No mock series behind it. */
function ChartEmptyState() {
  return (
    <div className="flex h-40 items-center justify-center text-xs text-ink-400">
      No data available
    </div>
  );
}

function ChartPanel({ title, filters, legend, children }) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink-800">{title}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {filters?.map((f, i) =>
            f && typeof f === "object" && "label" in f && "opts" in f ? (
              <SmallSelect key={i} value={f.label} options={f.opts} />
            ) : (
              <span key={i}>{f}</span>
            ),
          )}
        </div>
      </div>
      {legend && (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px]">
          {legend.map((l, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 text-ink-600"
            >
              <span className={clsx("h-2 w-2 rounded-full", l.dot)} /> {l.label}
            </span>
          ))}
        </div>
      )}
      {children}
    </Card>
  );
}

function SmallSelect({ value, options }) {
  return (
    <div className="relative">
      <Select defaultValue={value}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </div>
  );
}
function SourceTypeSelect({ value, options, onChange, loading }) {
  return (
    <div className="relative">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">All Sources</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
/* ────────────────────────────────────────────────────────────────────
 * Section 4 - Inventory (aging widgets)
 * REAL, no mock fallback: GET /parts/GetInventoryStockForGMS.
 * ──────────────────────────────────────────────────────────────────── */

function InventorySection() {
  const [range, setRange] = useState("This Year");
  const { inventory } = useDashboardData();

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={Boxes}
        iconTone="emerald"
        title="Inventory"
        right={
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-600">
              <span className="h-2 w-2 rounded-full bg-brand-600" /> Price
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-600">
              <span className="h-2 w-2 rounded-full bg-accent-500" /> Count
            </span>
            <SmallSelect
              value={range}
              options={["This Year", "Last Year", "YTD"]}
            />
          </div>
        }
      />

      <Card>
        {inventory ? (
          <div className="flex flex-wrap items-center gap-4">
            <InventoryTotalCard
              label="Total Inventory"
              value={formatCompact(inventory.summary.totalValue)}
              tone="brand"
            />
            <InventoryTotalCard
              label="Total Parts Count"
              value={Number(inventory.summary.totalCount).toLocaleString(
                "en-IN",
              )}
              tone="accent"
            />

            <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {inventory.buckets.map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <MiniBarPair
                    priceLabel={formatCompact(b.value)}
                    count={b.count}
                    priceWidth={64}
                    countWidth={40}
                  />
                  <p className="text-[10px] text-ink-500">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-xs text-ink-400">
            No inventory data available
          </div>
        )}
      </Card>
    </section>
  );
}

function InventoryTotalCard({ label, value, unit, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-500",
    accent: "bg-accent-500",
  }[tone];
  return (
    <div className={clsx("w-40 rounded-xl p-3 text-white  ", tones)}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold ">
        {value}{" "}
        {unit && <span className="text-[12px] font-medium ">{unit}</span>}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Section 5 - Other Stats
 * REAL, no mock fallback: WIP / RFB, from POST /jobCard/dashboard.
 * STILL MOCK: Technician, Service Advisor, Brand wise, Parts Category,
 * Values Metric, Inventory Metric tables, and the three status cards -
 * none of these have a backend endpoint yet.
 * ──────────────────────────────────────────────────────────────────── */

function OtherStatsSection() {
  const [open, setOpen] = useState(true);
  const { wipRfb } = useDashboardData();

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={BarChart3}
        iconTone="emerald"
        title="Other Stats"
        right={
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded-md cursor-pointer p-1 text-ink-500 hover:bg-ink-100"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        }
      />

      {open && (
        <div className="space-y-4">
          {/* Row 1: Technician / Service Advisor / Brand wise - mock, no endpoint */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <StaffTable title="Technician" rows={TECHNICIAN_ROWS} />
            <StaffTable title="Service Advisor" rows={SERVICE_ADVISOR_ROWS} />
            <BrandTable />
          </div>

          {/* Row 2: Parts Category / Values Metric / Inventory Metric - mock, no endpoint */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PartsCategoryTable />
            <ValuesMetricTable />
            <InventoryMetricTable />
          </div>

          {/* Row 3: WIP / RFB (real) + Status Cards (mock, no endpoint) */}
          <div className="flex flex-wrap items-center gap-4">
            {wipRfb ? (
              <>
                <WipRfbCard
                  label="WIP"
                  tone="amber"
                  count={wipRfb.wip.count}
                  amount={wipRfb.wip.amount}
                />
                <WipRfbCard
                  label="RFB"
                  tone="blue"
                  count={wipRfb.rfb.count}
                  amount={wipRfb.rfb.amount}
                />
              </>
            ) : (
              <div className="flex min-w-[340px] items-center justify-center rounded-xl border border-ink-100 p-3 text-xs text-ink-400">
                WIP / RFB unavailable
              </div>
            )}
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {STATUS_CARDS.map((c) => (
                <StatusCard key={c.key} card={c} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StaffTable({ title, rows }) {
  return (
    <Card padded={false}>
      <div className="grid grid-cols-3 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <span className="text-ink-800 font-semibold">{title}</span>
        <span className=" text-ink-800 font-semibold text-right">FTD</span>
        <span className="text-ink-800 font-semibold text-right">MTD</span>
      </div>
      <div className="divide-y divide-ink-100">
        {rows.map((r) => (
          <div key={r.name} className="grid grid-cols-3 px-4 py-3 text-sm">
            <span className="text-ink-800">{r.name}</span>
            <span className="text-right text-ink-700">{r.ftd}</span>
            <span className="text-right font-semibold text-brand-700">
              {r.mtd}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BrandTable() {
  return (
    <Card padded={false}>
      <div className="border-b border-ink-100 bg-ink-50/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <div className="grid grid-cols-[1fr_1fr_1fr] items-end">
          <span className="text-ink-800 font-semibold">Brand wise</span>
          <div className="text-center">
            <p className="normal-case font-semibold text-ink-800">FTD</p>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-ink-400 font-semibold">Inflow</span>
              <span className="text-ink-400 font-semibold">Revenue</span>
            </div>
          </div>
          <div className="text-center">
            <p className="normal-case font-semibold text-ink-800">MTD</p>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-ink-400 font-semibold">Inflow</span>
              <span className="text-ink-400 font-semibold">Revenue</span>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-ink-100">
        {BRAND_WISE_ROWS.map((r) => (
          <div
            key={r.brand}
            className="grid grid-cols-[1fr_1fr_1fr] px-4 py-3 text-sm"
          >
            <span className="text-ink-800">{r.brand}</span>
            <div className="grid grid-cols-2 gap-1 text-center">
              <span className="text-ink-700">{r.ftdInflow}</span>
              <span className="font-semibold text-brand-700">
                {r.ftdRevenue}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-center">
              <span className="text-ink-700">{r.mtdInflow}</span>
              <span className="font-semibold text-brand-700">
                {r.mtdRevenue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PartsCategoryTable() {
  return (
    <Card padded={false}>
      <div className="border-b border-ink-100 bg-ink-50/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <div className="grid grid-cols-[1.2fr_1fr_1fr]">
          <span className="text-ink-800 font-semibold">Parts Category</span>
          <div className="text-center">
            <p className="normal-case font-semibold text-ink-800">FTD</p>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-ink-400 font-semibold">Count</span>
              <span className="text-ink-400 font-semibold">Value</span>
            </div>
          </div>
          <div className="text-center">
            <p className="normal-case font-semibold text-ink-800">MTD</p>
            <div className="grid grid-cols-2 gap-1">
              <span className="text-ink-400 font-semibold">Count</span>
              <span className="text-ink-400 font-semibold">Value</span>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-ink-100">
        {PARTS_CATEGORY_ROWS.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[1.2fr_1fr_1fr] px-4 py-3 text-sm"
          >
            <span className="text-ink-800">{r.name}</span>
            <div className="grid grid-cols-2 gap-1 text-center">
              <span className="text-ink-700">{r.ftdCount}</span>
              <span className="font-semibold text-brand-700">{r.ftdValue}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-center">
              <span className="text-ink-700">{r.mtdCount}</span>
              <span className="font-semibold text-brand-700">{r.mtdValue}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ValuesMetricTable() {
  const icons = {
    delivered: { image: deliveredJobcards },
    labour: { image: labourValues },
    parts: { image: partsValues },
  };
  return (
    <Card padded={false}>
      <div className="grid grid-cols-[1.6fr_0.7fr_0.8fr_0.9fr] border-b border-ink-100 bg-ink-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <span className="text-ink-800 font-semibold">Metric</span>
        <span className="text-right text-ink-800 font-semibold">FTD</span>
        <span className="text-right text-ink-800 font-semibold">MTD</span>
        <span className="text-right text-ink-800 font-semibold">Total</span>
      </div>
      <div className="divide-y divide-ink-100">
        {VALUES_METRIC_ROWS.map((r) => {
          const { image } = icons[r.key] ?? icons.parts;
          return (
            <div
              key={r.key}
              className="grid grid-cols-[1.6fr_0.7fr_0.8fr_0.9fr] items-center px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <img src={image} alt={r.label} className="h-10 w-10 " />
                <span className="text-ink-800">{r.label}</span>
              </span>
              <span className="text-right text-ink-700">{r.ftd}</span>
              <span className="text-right text-ink-700">{r.mtd}</span>
              <span className="text-right font-semibold text-brand-700">
                {r.total}
              </span>
            </div>
          );
        })}
        <div className="grid grid-cols-[1.6fr_0.7fr_0.8fr_0.9fr] items-center px-4 py-3 text-sm">
          <span className="font-semibold text-ink-800">Total Value</span>
          <span className="text-right font-semibold text-ink-800">
            {VALUES_METRIC_TOTAL.ftd}
          </span>
          <span className="text-right font-semibold text-ink-800">
            {VALUES_METRIC_TOTAL.mtd}
          </span>
          <span className="text-right font-bold text-accent-600">
            {VALUES_METRIC_TOTAL.total}
          </span>
        </div>
      </div>
    </Card>
  );
}

function InventoryMetricTable() {
  const icons = {
    orders: { image: partsOrders },
    intransit: { image: intransist },
    delivered: { image: delivered },
  };
  return (
    <Card padded={false}>
      <div className="grid grid-cols-[1.6fr_0.6fr_0.6fr_0.9fr] border-b border-ink-100 bg-ink-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
        <span className="text-ink-800 font-semibold">Metric</span>
        <span className="text-right text-ink-800 font-semibold">FTD</span>
        <span className="text-right text-ink-800 font-semibold">MTD</span>
        <span className="text-right text-ink-800 font-semibold">MTD Value</span>
      </div>
      <div className="divide-y divide-ink-100">
        {INVENTORY_METRIC_ROWS.map((r) => {
          const { image } = icons[r.key] ?? icons.orders;
          return (
            <div
              key={r.key}
              className="grid grid-cols-[1.6fr_0.6fr_0.6fr_0.9fr] items-center px-4 py-3 text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <img src={image} alt={r.label} className="h-10 w-10 " />
                <span className="text-ink-800">{r.label}</span>
              </span>
              <span className="text-right text-ink-700">{r.ftd}</span>
              <span className="text-right text-ink-700">{r.mtd}</span>
              <span className="text-right font-semibold text-brand-700">
                {r.mtdValue}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-emerald-100 bg-emerald-50/60 px-4 py-3 text-center text-sm">
        <span className="text-emerald-700">
          📦 {INVENTORY_METRIC_FOOTER.label}
        </span>{" "}
        <span className="font-bold text-emerald-700">
          {INVENTORY_METRIC_FOOTER.value}
        </span>
      </div>
    </Card>
  );
}

function WipRfbCard({ label, count, amount, tone = "amber" }) {
  const tones = {
    amber: {
      card: "border-amber-200 bg-amber-50/60",
      pill: "bg-amber-100 text-amber-700",
      pillValue: "text-amber-900",
      amount: "text-amber-900",
    },
    blue: {
      card: "border-brand-100 bg-brand-50/40",
      pill: "bg-brand-100 text-brand-700",
      pillValue: "text-brand-800",
      amount: "text-brand-700",
    },
  }[tone];

  return (
    <div className={clsx("min-w-[160px] rounded-xl border p-3", tones.card)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-700">{label}</span>
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            tones.pill,
          )}
        >
          Count{" "}
          <span className={clsx("font-semibold", tones.pillValue)}>
            {count}
          </span>
        </span>
      </div>
      <p className={clsx("text-xl font-bold", tones.amount)}>{amount}</p>
    </div>
  );
}

function StatusCard({ card }) {
  const tones = {
    blue: { bg: "bg-brand-600", image: rsaPos },
    red: { bg: "bg-red-500", image: insurancePos },
    orange: { bg: "bg-accent-500", image: partsAvailability },
  }[card.tone];

  return (
    <div
      className={clsx(
        "flex min-w-[160px] items-center gap-3 rounded-xl p-3 text-white shadow-card",
        tones.bg,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center ">
        <img src={tones.image} alt={card.label} className="h-11 w-11 " />
      </div>
      <div>
        <p className="text-xs font-semibold">{card.label}</p>
        <p className="text-md font-semibold">{card.status}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Shared header + month/year picker
 * ──────────────────────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, iconTone, title, right }) {
  const tones = {
    emerald: "bg-emerald-500 text-white",
  }[iconTone];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "flex h-6 w-6 items-center justify-center rounded-full",
            tones,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-lg font-bold text-ink-800">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function MonthYearPicker({ month, year, onMonth, onYear }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <SmallSelect value={month} options={MONTHS} />
      <SmallSelect value={year} options={YEARS} />
    </div>
  );
}
