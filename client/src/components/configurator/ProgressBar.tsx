import { Ship, Wrench, ClipboardCheck, CreditCard } from "lucide-react";

const STEPS = [
  { label: "Boat Details", icon: Ship },
  { label: "Services", icon: Wrench },
  { label: "Review", icon: ClipboardCheck },
  { label: "Secure Booking", icon: CreditCard },
];

interface ProgressBarProps {
  currentStep: number; // 0-indexed
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-0 right-0 h-px bg-white/10 z-0" />
        <div
          className="absolute top-5 left-0 h-px bg-[#00FFFF]/50 z-0 transition-all duration-700 ease-out"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="flex flex-col items-center gap-2 z-10 relative">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                  ${isCurrent
                    ? "bg-[#00FFFF] text-black shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                    : isActive
                      ? "bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  isCurrent ? "text-[#00FFFF]" : isActive ? "text-white/70" : "text-white/30"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile - compact */}
      <div className="sm:hidden flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= currentStep ? "bg-[#00FFFF]" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="sm:hidden text-xs text-white/50 mt-2 text-center">
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
      </p>
    </div>
  );
}
