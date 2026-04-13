/**
 * LivenessSteps
 * Displays the three liveness / matching check steps with animated states.
 *
 * Props:
 *   steps — array of { label, state: "pending" | "active" | "done" | "error" }
 */
export default function LivenessSteps({ steps }) {
  const icons = {
    done: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    active: (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    ),
    error: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    pending: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.4" />
      </svg>
    ),
  };

  const styles = {
    done:    "bg-[rgba(74,222,128,0.1)]  text-[#4ade80]",
    active:  "bg-[rgba(108,99,255,0.1)] text-[#a78bfa]",
    error:   "bg-[rgba(248,113,113,0.1)] text-[#f87171]",
    pending: "text-gray-500",
  };

  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${styles[step.state]}`}
        >
          <span className="flex-shrink-0">{icons[step.state]}</span>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}
