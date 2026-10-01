import clsx from "clsx";

const COLORS = {
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
  red: "text-red-500",
  brand: "text-brand-500",
};


export default function ProgressRing({ value = 0, size = 56, color = "brand", label }) {
  const stroke = Math.max(4, Math.round(size / 12));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  const colorClass = COLORS[color] ?? COLORS.brand;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-ink-100" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={clsx("transition-all duration-500", colorClass)}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-ink-700" style={{ fontSize: Math.max(10, Math.round(size / 5)) }}>
        {label ?? `${value}%`}
      </span>
    </div>
  );
}