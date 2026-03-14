interface TierOption {
  value: string;
  label: string;
  multiplier: string;
  description: string;
}

interface TierSelectorProps {
  tiers: TierOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export default function TierSelector({ tiers, selected, onSelect }: TierSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tiers.map((tier) => {
        const isActive = selected === tier.value;
        return (
          <button
            key={tier.value}
            type="button"
            onClick={() => onSelect(tier.value)}
            className={`
              text-left p-4 rounded-xl border transition-all duration-300
              ${isActive
                ? "border-[#00FFFF]/50 bg-[#00FFFF]/[0.06] shadow-[0_0_20px_rgba(0,255,255,0.08)]"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }
            `}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-semibold text-sm ${isActive ? "text-white" : "text-white/70"}`}>
                {tier.label}
              </span>
              <span
                className={`
                  text-xs font-mono px-2 py-0.5 rounded-full transition-all duration-300
                  ${isActive
                    ? "bg-[#00FFFF]/20 text-[#00FFFF]"
                    : "bg-white/5 text-white/40"
                  }
                `}
              >
                {tier.multiplier}
              </span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">{tier.description}</p>
          </button>
        );
      })}
    </div>
  );
}
