/**
 * PulseBar - Reusable component for visualizing pulse values (0-100 scale)
 * Based on StatusDisplay's StatBar pattern
 */

interface PulseBarProps {
  /** Label text to display */
  label: string;
  /** Value from 0-100 */
  value: number;
  /** Color variant for the bar fill */
  color?: "amber" | "red" | "green" | "blue";
  /** If true, display inverted (100 - value) */
  inverted?: boolean;
  /** Optional: use compact layout */
  compact?: boolean;
}

const colorClasses = {
  amber: "bg-amber-500",
  red: "bg-red-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
};

export function PulseBar({
  label,
  value,
  color = "amber",
  inverted = false,
  compact = false,
}: PulseBarProps) {
  const displayValue = inverted ? 100 - value : value;
  const clampedValue = Math.max(0, Math.min(100, displayValue));

  if (!value) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 w-16 truncate">{label}</span>
        <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClasses[color]}`}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        <span className="text-xs text-zinc-600 w-6 text-right">
          {Math.round(value)}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
