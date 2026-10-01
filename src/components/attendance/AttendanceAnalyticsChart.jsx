import { useState, useMemo } from "react";
import clsx from "clsx";
import { TrendingUp, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  ANALYTICS_WEEKS,
  ANALYTICS_SUMMARY,
  STATUS_BY_KEY,
} from "@/pages/attendance/mockAttendance";
import { showToast } from "@/utils/toast";
import Input from "@/components/ui/Input";

const PERIOD_TABS = ["Today", "7D", "14D", "30D"];

// Deterministic pseudo-random generator so re-renders don't jitter the chart
function seededValue(seed, min, max) {
  const x = Math.sin(seed * 999) * 10000;
  const frac = x - Math.floor(x);
  return Math.round(min + frac * (max - min));
}

/** Builds a dataset of { week, present } points for the given period. */
function getSeriesForPeriod(period) {
  const total = ANALYTICS_SUMMARY.totalEmployees || 40;
  const upper = Math.round(total * 0.9);
  const lower = Math.round(total * 0.5);

  if (period === "Today") {
    const hours = ["8AM", "10AM", "12PM", "2PM", "4PM", "6PM"];
    return hours.map((h, i) => ({
      week: h,
      present: seededValue(i + 1, lower, upper),
    }));
  }

  if (period === "7D") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((d, i) => ({
      week: d,
      present: seededValue(i + 10, lower, upper),
    }));
  }

  if (period === "14D") {
    return Array.from({ length: 14 }, (_, i) => ({
      week: `D${i + 1}`,
      present: seededValue(i + 20, lower, upper),
    }));
  }

  // 30D — use the existing weekly mock data
  return ANALYTICS_WEEKS;
}

export default function AttendanceAnalyticsChart() {
  const [period, setPeriod] = useState("7D");
  const [chartType, setChartType] = useState("line");
  const [from, setFrom] = useState("10/7/2026");
  const [to, setTo] = useState("10/7/2026");

  const series = useMemo(() => getSeriesForPeriod(period), [period]);

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-semibold text-ink-800">
            Attendance Analytics
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-ink-200 p-0.5">
            {PERIOD_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPeriod(t)}
                className={clsx(
                  "rounded-md px-2.5 cursor-pointer py-1 text-xs font-semibold transition-colors",
                  period === t
                    ? "bg-accent-500 text-white"
                    : "text-ink-600 hover:bg-ink-50",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              min={0}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="From"
              className="h-8 w-28 px-2 text-xs"
            />

            <span className="text-xs text-ink-400">to</span>

            <Input
              type="date"
              min={0}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To"
              className="h-8 w-28 px-2 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-ink-200 p-0.5">
            {["bar", "line"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setChartType(t)}
                className={clsx(
                  "rounded-md px-2.5 py-1 cursor-pointer text-xs font-semibold capitalize transition-colors",
                  chartType === t
                    ? "bg-brand-600 text-white"
                    : "text-ink-600 hover:bg-ink-50",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={() => showToast.success("Exporting chart...")}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="p-4">
        <ChartBody type={chartType} data={series} />

        {/* Chart legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          {["P", "A", "L", "DR", "OD"].map((k) => {
            const s = STATUS_BY_KEY[k];
            return (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 text-ink-600"
              >
                <span className={clsx("h-2 w-2 rounded-full", s.dot)} />
                {s.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom summary strip */}
      <div className="grid grid-cols-2 gap-2 border-t border-ink-100 p-4 text-center sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCell
          label="Total Employees"
          value={ANALYTICS_SUMMARY.totalEmployees}
          valueClass="text-ink-800"
        />
        <SummaryCell
          label="Avg Present"
          value={ANALYTICS_SUMMARY.avgPresent}
          valueClass="text-emerald-600"
        />
        <SummaryCell
          label="Avg Absent"
          value={ANALYTICS_SUMMARY.avgAbsent}
          valueClass="text-red-600"
        />
        <SummaryCell
          label="Avg Leave"
          value={ANALYTICS_SUMMARY.avgLeave}
          valueClass="text-pink-600"
        />
        <SummaryCell
          label="Avg Duty Rest"
          value={ANALYTICS_SUMMARY.avgDutyRest}
          valueClass="text-violet-600"
        />
        <SummaryCell
          label="Avg Attendance"
          value={`${ANALYTICS_SUMMARY.avgAttendance}%`}
          valueClass="text-accent-600"
        />
      </div>
    </Card>
  );
}
function ChartBody({ type, data }) {
  const W = 900,
    H = 240;
  const padLeft = 46,
    padRight = 24,
    padTop = 28,
    padBottom = 34;
  const barInset = 30;
  const innerW = W - padLeft - padRight - barInset * 2;
  const innerH = H - padTop - padBottom;
  const maxY = 40;
  const yTicks = [0, 10, 20, 30, 40];

  const gapX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = data.map((w, i) => ({
    x: padLeft + barInset + gapX * i,
    y: padTop + innerH - (w.present / maxY) * innerH,
    week: w.week,
    present: w.present,
  }));
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px] w-full">
        {/* 1. Grid lines only — drawn behind everything */}
        {yTicks.map((v) => {
          const y = padTop + innerH - (v / maxY) * innerH;
          return (
            <line
              key={v}
              x1={padLeft}
              x2={W - padRight}
              y1={y}
              y2={y}
              className="stroke-ink-100"
              strokeDasharray="2 3"
            />
          );
        })}

        {/* 2. Data — bars or line, drawn on top of grid lines */}
        {type === "line" ? (
          <>
            <path
              d={pathD}
              className="fill-none stroke-violet-500"
              strokeWidth="2"
            />
            {points.map((p) => (
              <circle
                key={p.week}
                cx={p.x}
                cy={p.y}
                r="4"
                className="fill-white stroke-violet-500"
                strokeWidth="2"
              />
            ))}
          </>
        ) : (
          points.map((p) => {
            const barW = Math.min(32, Math.max(10, gapX * 0.5));
            const barH = padTop + innerH - p.y;
            return (
              <rect
                key={p.week}
                x={p.x - barW / 2}
                y={p.y}
                width={barW}
                height={barH}
                rx="4"
                className="fill-violet-400"
              />
            );
          })
        )}

        {/* 3. Y-axis labels — drawn LAST so they always sit on top of bars/line */}
        {yTicks.map((v) => {
          const y = padTop + innerH - (v / maxY) * innerH;
          return (
            <text
              key={v}
              x={padLeft - 10}
              y={y + 3}
              textAnchor="end"
              className="fill-ink-500 text-[10px] font-medium"
            >
              {v}
            </text>
          );
        })}

        {/* X-axis labels — also drawn last, on top */}
        {points.map((p) => (
          <text
            key={p.week}
            x={p.x}
            y={H - 10}
            textAnchor="middle"
            className="fill-ink-500 text-[11px]"
          >
            {p.week}
          </text>
        ))}
      </svg>
    </div>
  );
}

function SummaryCell({ label, value, valueClass }) {
  return (
    <div>
      <p className={clsx("text-lg font-bold", valueClass)}>{value}</p>
      <p className="text-[11px] text-ink-500">{label}</p>
    </div>
  );
}
