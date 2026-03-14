interface OptionToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function OptionToggle({ id, label, checked, onChange }: OptionToggleProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={() => onChange(!checked)}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all duration-200
        ${checked
          ? "border-[#00FFFF]/30 bg-[#00FFFF]/[0.06] text-white"
          : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:bg-white/[0.04]"
        }
      `}
    >
      <div
        className={`
          w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all duration-200
          ${checked ? "bg-[#00FFFF] text-black" : "border border-white/20"}
        `}
      >
        {checked && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span>{label}</span>
    </button>
  );
}
