import { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import { TrendingUp, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  ANALYTICS_SUMMARY,
} from "@/pages/attendance/mockAttendance";
import { attendanceApi } from "@/services/api/attendanceApi";
import { showToast } from "@/utils/toast";

const PERIOD_TABS = ["7D", "30D", "3M", "6M", "1Y"];

const SERIES_CONFIG = [
  { key: "present", label: "Present", code: "P", color: "#10b981", bg: "bg-emerald-500", text: "text-emerald-700" },
  { key: "absent", label: "Absent", code: "A", color: "#ef4444", bg: "bg-red-500", text: "text-red-700" },
  { key: "leave", label: "Leave", code: "L", color: "#ec4899", bg: "bg-pink-500", text: "text-pink-700" },
  { key: "dutyRest", label: "Duty Rest", code: "DR", color: "#8b5cf6", bg: "bg-violet-500", text: "text-violet-700" },
  { key: "onDuty", label: "On Duty", code: "OD", color: "#2f66d6", bg: "bg-brand-500", text: "text-brand-700" },
];

export default function AttendanceAnalyticsChart({ refreshKey } = {}) {
  const [period, setPeriod] = useState("7D");
  const [chartType, setChartType] = useState("line");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const isCustomRange = from && to;
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(ANALYTICS_SUMMARY);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async (customParams) => {
    try {
      setLoading(true);
      let params;
      if (customParams) {
        params = customParams;
      } else if (from && to) {
        params = { from, to };
      } else {
        params = { period };
      }
      const res = await attendanceApi.getAnalytics(params);
      if (res && res.requestSuccessful) {
        setSeries(Array.isArray(res.series) ? res.series : []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [period, from, to]);

  useEffect(() => {
    fetchAnalytics({ period });
  }, [refreshKey]);

  const handleApplyCustomRange = () => {
    if (from && to) fetchAnalytics({ from, to });
  };

  const handlePeriodClick = (t) => {
    setFrom("");
    setTo("");
    setPeriod(t);
    fetchAnalytics({ period: t });
  };

  const handleClearCustomRange = () => {
    setFrom("");
    setTo("");
    fetchAnalytics({ period });
  };


  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = from && to ? { from, to } : { period };
      const res = await attendanceApi.exportAnalytics(params);

      if (!res) {
        showToast.error("Failed to generate analytics export.");
        return;
      }

      if (res.type === "application/json") {
        const text = await res.text();
        const json = JSON.parse(text);
        showToast.error(json.message || "Export failed.");
        return;
      }

      const blob = new Blob([res], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileLabel = from && to ? `${from}_to_${to}` : period;
      a.download = `Attendance_Analytics_${fileLabel}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast.success("Analytics exported to Excel successfully.");
    } catch (err) {
      console.error("Export analytics error:", err);
      showToast.error(err.message || "Failed to download analytics Excel.");
    } finally {
      setExporting(false);
    }
  };

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
                onClick={() => handlePeriodClick(t)}
                className={clsx(
                  "rounded-md px-2.5 cursor-pointer py-1 text-xs font-semibold transition-colors",
                  !isCustomRange && period === t
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
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="From"
              className={clsx("h-8 w-32 px-2 text-xs", isCustomRange && "ring-1 ring-accent-500")}
            />

            <span className="text-xs text-ink-400">to</span>

            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To"
              className={clsx("h-8 w-32 px-2 text-xs", isCustomRange && "ring-1 ring-accent-500")}
            />
            {isCustomRange && (
              <button
                type="button"
                onClick={handleApplyCustomRange}
                className="rounded-md bg-accent-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-600 cursor-pointer transition-colors"
              >
                Apply
              </button>
            )}
            {(from || to) && (
              <button
                type="button"
                onClick={handleClearCustomRange}
                className="rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-500 hover:bg-ink-50 cursor-pointer"
              >
                Clear
              </button>
            )}
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
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <div className={clsx("p-4 transition-opacity", loading && "opacity-60")}>
        <ChartBody type={chartType} data={series} />

        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          {SERIES_CONFIG.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label} ({s.code})
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-ink-100 p-4 text-center sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCell
          label="Total Employees"
          value={summary.totalEmployees}
          valueClass="text-ink-800"
        />
        <SummaryCell
          label="Avg Present"
          value={summary.avgPresent}
          valueClass="text-emerald-600"
        />
        <SummaryCell
          label="Avg Absent"
          value={summary.avgAbsent}
          valueClass="text-red-600"
        />
        <SummaryCell
          label="Avg Leave"
          value={summary.avgLeave}
          valueClass="text-pink-600"
        />
        <SummaryCell
          label="Avg Duty Rest"
          value={summary.avgDutyRest}
          valueClass="text-violet-600"
        />
        <SummaryCell
          label="Avg Attendance"
          value={`${summary.avgAttendance}%`}
          valueClass="text-accent-600"
        />
      </div>
    </Card>
  );
}

function ChartBody({ type, data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const W = 900,
    H = 260;
  const padLeft = 46,
    padRight = 24,
    padTop = 28,
    padBottom = 38;
  const barInset = 36;
  const innerW = W - padLeft - padRight - barInset * 2;
  const innerH = H - padTop - padBottom;

  const visibleSeries = SERIES_CONFIG.filter((s) =>
    data.some((d) => (Number(d[s.key]) || 0) > 0)
  );

  if (!data || data.length === 0 || visibleSeries.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-ink-400">
        No attendance analytics data available for this range.
      </div>
    );
  }

  const maxDataVal = Math.max(
    ...data.flatMap((w) => visibleSeries.map((s) => Number(w[s.key]) || 0)),
    1
  );
  const maxY = Math.max(5, Math.ceil(maxDataVal));

  let yTicks = [];
  if (maxY <= 5) {
    yTicks = [1, 2, 3, 4, 5];
  } else if (maxY <= 10) {
    yTicks = [1, 2, 4, 6, 8, 10].filter((v) => v <= maxY);
    if (!yTicks.includes(maxY)) yTicks.push(maxY);
  } else {
    const step = Math.ceil((maxY - 1) / 4);
    yTicks = [1];
    for (let val = 1 + step; val < maxY; val += step) {
      yTicks.push(val);
    }
    if (!yTicks.includes(maxY)) yTicks.push(maxY);
  }

  const gapX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const getX = (i) =>
    data.length === 1
      ? padLeft + barInset + innerW / 2
      : padLeft + barInset + gapX * i;

  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hoveredX = hoveredIdx !== null ? getX(hoveredIdx) : 0;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="min-w-[560px] w-full select-none"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Horizontal grid lines & ticks starting from 1 (no 0) */}
        {yTicks.map((v) => {
          const y = padTop + innerH - (v / maxY) * innerH;
          return (
            <g key={v}>
              <line
                x1={padLeft}
                x2={W - padRight}
                y1={y}
                y2={y}
                className="stroke-ink-100"
                strokeDasharray="2 3"
              />
              <text
                x={padLeft - 10}
                y={y + 3}
                textAnchor="end"
                className="fill-ink-500 text-[10px] font-medium"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Clean baseline for chart floor (without a 0 tick) */}
        <line
          x1={padLeft}
          x2={W - padRight}
          y1={padTop + innerH}
          y2={padTop + innerH}
          className="stroke-ink-200"
          strokeWidth="1"
        />

        {/* LINE CHART: Render only visible series lines */}
        {type === "line" &&
          visibleSeries.map((s) => {
            const points = data.map((d, i) => {
              const val = Number(d[s.key]) || 0;
              return {
                x: getX(i),
                y: padTop + innerH - (Math.min(val, maxY) / maxY) * innerH,
                val,
                week: d.week,
              };
            });
            const pathD = points
              .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join(" ");

            return (
              <g key={s.key}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((p, idx) => (
                  <circle
                    key={`${s.key}-${idx}`}
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIdx === idx ? "5" : "3.5"}
                    fill="#ffffff"
                    stroke={s.color}
                    strokeWidth={hoveredIdx === idx ? "3" : "2"}
                    className="transition-all"
                  />
                ))}
              </g>
            );
          })}

        {/* BAR CHART: Render clustered bars only for visible series */}
        {type === "bar" &&
          data.map((d, i) => {
            const cx = getX(i);
            const n = visibleSeries.length;
            const groupWidth = Math.min(65, Math.max(20, (gapX || 80) * 0.75));
            const barW = Math.max(3, Math.min(11, groupWidth / Math.max(1, n)));

            return (
              <g key={`bar-group-${i}`}>
                {visibleSeries.map((s, sIdx) => {
                  const val = Number(d[s.key]) || 0;
                  const barH = (Math.min(val, maxY) / maxY) * innerH;
                  const bx = cx - (n * barW) / 2 + sIdx * barW;
                  const by = padTop + innerH - barH;

                  return (
                    <rect
                      key={`${d.week}-${s.key}`}
                      x={bx + 0.5}
                      y={by}
                      width={Math.max(1, barW - 1)}
                      height={Math.max(val > 0 ? 2 : 0, barH)}
                      fill={s.color}
                      opacity={hoveredIdx !== null && hoveredIdx !== i ? 0.45 : 1}
                      rx="2"
                      className="transition-opacity"
                    />
                  );
                })}
              </g>
            );
          })}

        {/* X Axis Labels */}
        {data.map((p, i) => (
          <text
            key={p.week}
            x={getX(i)}
            y={H - 12}
            textAnchor="middle"
            className={clsx(
              "text-[11px] font-medium transition-colors",
              hoveredIdx === i ? "fill-ink-900 font-bold" : "fill-ink-500"
            )}
          >
            {p.week}
          </text>
        ))}

        {/* Hit areas for hover detection */}
        {data.map((d, i) => {
          const cx = getX(i);
          const colW = gapX || 60;
          return (
            <rect
              key={`hit-${i}`}
              x={cx - colW / 2}
              y={padTop}
              width={colW}
              height={innerH}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          );
        })}

        {/* Hover vertical guideline & tooltip overlay */}
        {hoveredIdx !== null && hoveredItem && (
          <g className="pointer-events-none">
            <line
              x1={hoveredX}
              x2={hoveredX}
              y1={padTop}
              y2={padTop + innerH}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
            {/* Tooltip Card */}
            {(() => {
              const tooltipW = 160;
              const tooltipH = 26 + visibleSeries.length * 16;
              const tooltipX = Math.min(
                W - padRight - tooltipW,
                Math.max(padLeft, hoveredX - tooltipW / 2)
              );
              const tooltipY = padTop + 4;

              return (
                <g transform={`translate(${tooltipX}, ${tooltipY})`}>
                  <rect
                    width={tooltipW}
                    height={tooltipH}
                    rx="6"
                    className="fill-ink-900/90 shadow-lg"
                  />
                  <text
                    x="10"
                    y="16"
                    className="fill-white text-[11px] font-bold"
                  >
                    {hoveredItem.week}
                  </text>
                  {visibleSeries.map((s, idx) => (
                    <g key={s.key} transform={`translate(10, ${30 + idx * 16})`}>
                      <circle cx="4" cy="-3" r="3.5" fill={s.color} />
                      <text x="14" y="0" className="fill-ink-200 text-[10px]">
                        {s.label}:
                      </text>
                      <text
                        x={tooltipW - 20}
                        y="0"
                        textAnchor="end"
                        className="fill-white text-[10px] font-semibold"
                      >
                        {hoveredItem[s.key] ?? 0}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </g>
        )}
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
