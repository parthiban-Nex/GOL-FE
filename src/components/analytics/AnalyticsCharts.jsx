import clsx from "clsx";


const MAX_LABELS = 8;


function thinLabels(labels) {
  if (labels.length <= MAX_LABELS) return labels.map(() => true);
  const step = Math.ceil(labels.length / MAX_LABELS);
  return labels.map((_, i) => i % step === 0 || i === labels.length - 1);
}

export function AreaChart({ months, values, highlight, tone = "brand" }) {
  const W = 320,
    H = 140,
    padX = 20,
    padY = 20;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const rawMax = Math.max(...values, 0);
  const max = rawMax > 0 ? rawMax * 1.1 : 1;

  const gapX = innerW / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => ({
    x: padX + gapX * i,
    y: padY + innerH - (v / max) * innerH,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath =
    points.length > 1
      ? `${linePath} L${points[points.length - 1].x},${padY + innerH} L${points[0].x},${padY + innerH} Z`
      : "";

  const stroke = tone === "brand" ? "stroke-brand-600" : "stroke-accent-500";
  const fill = tone === "brand" ? "fill-brand-500/15" : "fill-accent-500/15";
  const dotFill = tone === "brand" ? "fill-brand-600" : "fill-accent-500";

  const hlIdx = highlight ? months.indexOf(highlight.month) : -1;
  const hlPt = hlIdx >= 0 ? points[hlIdx] : null;
  const showLabel = thinLabels(months);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full">
        {areaPath && <path d={areaPath} className={fill} />}
        <path
          d={linePath}
          className={clsx("fill-none", stroke)}
          strokeWidth="2"
        />
        {hlPt && (
          <>
            <text
              x={hlPt.x}
              y={hlPt.y - 10}
              textAnchor="middle"
              className="fill-ink-800 text-[10px] font-bold"
            >
              {highlight.value}
            </text>
            <circle cx={hlPt.x} cy={hlPt.y} r="5" className={dotFill} />
            <circle
              cx={hlPt.x}
              cy={hlPt.y}
              r="7"
              className={clsx("fill-none", stroke)}
              strokeWidth="1.5"
            />
          </>
        )}
        {months.map(
          (m, i) =>
            showLabel[i] && (
              <text
                key={m + i}
                x={points[i].x}
                y={H + 12}
                textAnchor="middle"
                className="fill-ink-500 text-[9px]"
              >
                {m}
              </text>
            ),
        )}
      </svg>
    </div>
  );
}


export function GroupedBarChart({ labels, series, sharedScale = false }) {
  const W = 320,
    H = 160,
    padX = 30,
    padY = 18;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const globalMax = Math.max(...series.flatMap((s) => s.values), 0) * 1.15 || 1;
  const perTickMax = labels.map((_, i) => {
    const tickMax = Math.max(...series.map((s) => s.values[i] ?? 0), 0) * 1.15;
    return tickMax || 1;
  });

  const groupW = innerW / labels.length;
  const barW = Math.min(10, groupW / (series.length + 1));
  const showLabel = thinLabels(labels);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full">
        {labels.map((label, i) => {
          const groupCenterX = padX + groupW * i + groupW / 2;
          const max = sharedScale ? globalMax : perTickMax[i];
          return (
            <g key={label + i}>
              {series.map((s, si) => {
                const v = s.values[i] ?? 0;
                const barH = (v / max) * innerH;
                const x =
                  groupCenterX -
                  (barW * series.length + 1) / 2 +
                  si * (barW + 1);
                const y = padY + innerH - barH;
                return (
                  <rect
                    key={si}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(barH, 0)}
                    rx="2"
                    className={s.color}
                  />
                );
              })}
              {showLabel[i] && (
                <text
                  x={groupCenterX}
                  y={H + 10}
                  textAnchor="middle"
                  className="fill-ink-500 text-[9px]"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── StackedBarChart (Labour / Parts) ────────────────────────────── */

export function StackedBarChart({ labels, series }) {
  const W = 320,
    H = 160,
    padX = 30,
    padY = 18;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const sums = labels.map((_, i) =>
    series.reduce((s, ser) => s + (ser.values[i] ?? 0), 0),
  );
  const rawMax = Math.max(...sums, 0);
  const max = rawMax > 0 ? rawMax * 1.15 : 1;

  const groupW = innerW / labels.length;
  const barW = Math.min(14, groupW * 0.55);
  const showLabel = thinLabels(labels);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full">
        {labels.map((label, i) => {
          const cx = padX + groupW * i + groupW / 2;
          let y = padY + innerH;
          return (
            <g key={label + i}>
              {series.map((s, si) => {
                const barH = ((s.values[i] ?? 0) / max) * innerH;
                y -= barH;
                return (
                  <rect
                    key={si}
                    x={cx - barW / 2}
                    y={y}
                    width={barW}
                    height={Math.max(barH, 0)}
                    rx={si === series.length - 1 ? "2" : "0"}
                    className={s.color}
                  />
                );
              })}
              {showLabel[i] && (
                <text
                  x={cx}
                  y={H + 10}
                  textAnchor="middle"
                  className="fill-ink-500 text-[9px]"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── DonutChart (New vs Repeat) ──────────────────────────────────── */
/* Unchanged - this one already renders correctly against live data. */

export function DonutChart({ segments }) {
  const size = 160,
    cx = size / 2,
    cy = size / 2,
    r = 55,
    stroke = 24;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[160px]"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        className="stroke-ink-100"
        strokeWidth={stroke}
      />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * circumference;
        const gap = circumference - dash;
        const rot = (offset / total) * 360 - 90;
        offset += s.value;
        return (
          <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              className={s.color}
            />
          </g>
        );
      })}
      {(() => {
        let running = 0;
        return segments.map((s, i) => {
          const mid = running + s.value / 2;
          const angle = (mid / total) * 2 * Math.PI - Math.PI / 2;
          running += s.value;
          const lr = r + 8;
          const px = cx + Math.cos(angle) * lr;
          const py = cy + Math.sin(angle) * lr;
          return (
            <g key={"lbl" + i}>
              <circle cx={px} cy={py} r="11" className="fill-ink-200" />
              <text
                x={px}
                y={py + 3}
                textAnchor="middle"
                className={clsx(
                  "text-[10px] font-bold",
                  i === 0 ? "fill-accent-600" : "fill-brand-700",
                )}
              >
                {s.value}
              </text>
            </g>
          );
        });
      })()}
    </svg>
  );
}

/* ─── MiniBarPair (Inventory aging widgets) ────────────────────────── */
/* Unchanged. */

export function MiniBarPair({
  priceLabel,
  count,
  priceWidth = 100,
  countWidth = 140,
}) {
  const totalWidth = priceWidth + countWidth;

  return (
    <div style={{ width: `${totalWidth}px` }}>
      <div className="text-sm font-bold text-ink-800">{priceLabel}</div>

      <div className="mt-1 flex">
        <span
          className="block h-3 rounded-l-sm bg-brand-500"
          style={{ width: `${priceWidth}px` }}
        />
        <span
          className="block h-3 mt-3 rounded-r-sm bg-accent-500"
          style={{ width: `${countWidth}px` }}
        />
      </div>

      <div className="mt-1 text-right text-sm font-bold text-ink-800">
        {count}
      </div>
    </div>
  );
}
