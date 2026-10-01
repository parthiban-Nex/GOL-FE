
export function BotAvatar({ size = 40 }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className="shrink-0"
      aria-label="Assistant"
    >
      <defs>
        <linearGradient id="ql-bot-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="18"
        fill="url(#ql-bot-grad)"
      />
      {/* antenna */}
      <line
        x1="20"
        y1="6"
        x2="20"
        y2="10"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="5" r="1.6" fill="white" />
      {/* eyes */}
      <ellipse cx="14" cy="19" rx="2.4" ry="3" fill="white" />
      <ellipse cx="26" cy="19" rx="2.4" ry="3" fill="white" />
      <circle cx="14.5" cy="19.5" r="0.9" fill="#1f2937" />
      <circle cx="26.5" cy="19.5" r="0.9" fill="#1f2937" />
      {/* smile */}
      <path
        d="M14 26 Q20 30 26 26"
        stroke="white"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
