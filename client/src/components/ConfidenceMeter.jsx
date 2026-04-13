/**
 * ConfidenceMeter
 * Displays a face-match confidence score as an animated bar.
 *
 * Props:
 *   value   — 0–100
 *   label   — string override (optional)
 *   visible — whether to show
 */
export default function ConfidenceMeter({ value = 0, label, visible = true }) {
  if (!visible) return null;

  const color =
    value >= 80 ? "#4ade80" :
    value >= 60 ? "#6c63ff" :
    value >= 40 ? "#f59e0b" :
                  "#f87171";

  const displayLabel =
    label ||
    (value === 0  ? "Scanning..." :
     value >= 80  ? "Strong match" :
     value >= 60  ? "Good match" :
     value >= 40  ? "Weak match" :
                    "No match");

  return (
    <div className="rounded-xl p-3 bg-dark-600 border border-[rgba(108,99,255,0.15)]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Face match confidence</span>
        <span className="text-xs font-medium" style={{ color }}>
          {value > 0 ? `${value}%` : ""} {displayLabel}
        </span>
      </div>
      <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, #6c63ff, ${color})`,
          }}
        />
      </div>
    </div>
  );
}
