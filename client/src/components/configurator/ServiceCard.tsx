import { Check, ChevronRight } from "lucide-react";
import type { ServiceKey } from "@/components/LearnMoreModal";

interface ServiceCardProps {
  id: ServiceKey;
  title: string;
  description: string;
  selected: boolean;
  onToggle: () => void;
  onLearnMore: () => void;
  children?: React.ReactNode; // expansion content
}

export default function ServiceCard({
  title,
  description,
  selected,
  onToggle,
  onLearnMore,
  children,
}: ServiceCardProps) {
  return (
    <div
      className={`
        rounded-2xl border transition-all duration-300 overflow-hidden
        ${selected
          ? "border-[#00FFFF]/40 bg-[#00FFFF]/[0.03] shadow-[0_0_30px_rgba(0,255,255,0.06)]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
        }
      `}
    >
      {/* Card Header — clickable to toggle */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Toggle indicator */}
        <div
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300
            ${selected
              ? "bg-[#00FFFF] text-black"
              : "border border-white/20 bg-white/5 text-transparent"
            }
          `}
        >
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold transition-colors duration-300 ${selected ? "text-white" : "text-white/80"}`}>
            {title}
          </h3>
          <p className="text-sm text-white/50 mt-0.5 line-clamp-1">{description}</p>
        </div>

        {/* Learn More */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLearnMore();
          }}
          className="shrink-0 text-xs font-medium text-[#00FFFF] hover:text-[#00FFFF]/80 transition-colors flex items-center gap-1"
        >
          Learn More
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Expansion panel */}
      {selected && children && (
        <div className="px-5 pb-5 pt-0">
          <div className="border-t border-white/10 pt-5 space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
