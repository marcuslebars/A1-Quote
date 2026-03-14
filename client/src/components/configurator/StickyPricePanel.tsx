import AnimatedPrice from "./AnimatedPrice";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LineItem {
  label: string;
  amount: number;
}

interface StickyPricePanelProps {
  lineItems: LineItem[];
  subtotal: number;
  requiresManualReview: boolean;
  reviewReasons: string[];
  breakdown: string[];
  canSubmit: boolean;
  isSubmitting: boolean;
  isDownloadingPDF: boolean;
  onSubmit: () => void;
  onDownloadPDF: () => void;
}

export default function StickyPricePanel({
  lineItems,
  subtotal,
  requiresManualReview,
  reviewReasons,
  breakdown,
  canSubmit,
  isSubmitting,
  isDownloadingPDF,
  onSubmit,
  onDownloadPDF,
}: StickyPricePanelProps) {
  const hasItems = lineItems.length > 0;
  const deposit = 250;

  return (
    <>
      {/* ── Desktop: sticky right panel ── */}
      <div className="hidden lg:block">
        <div className="sticky top-32">
          <div className="rounded-2xl border border-white/10 bg-[#2B2B2B] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10">
              <p className="text-xs font-medium uppercase tracking-widest text-[#00FFFF]/70">
                Estimated Total
              </p>
              <AnimatedPrice
                value={subtotal}
                className="text-3xl font-bold text-white mt-1 block"
              />
            </div>

            {/* Line items */}
            {hasItems && (
              <div className="px-6 py-4 space-y-3 border-b border-white/10 max-h-[240px] overflow-y-auto">
                {lineItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-white/60 truncate pr-3">{item.label}</span>
                    <span className="text-sm font-medium text-white shrink-0">
                      ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Manual review notice */}
            {requiresManualReview && (
              <div className="px-6 py-3 bg-[#00FFFF]/[0.05] border-b border-white/10">
                <p className="text-xs font-medium text-[#00FFFF]">Manual Review Required</p>
                <ul className="mt-1 space-y-0.5">
                  {reviewReasons.map((r, i) => (
                    <li key={i} className="text-xs text-white/40">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deposit */}
            {hasItems && !requiresManualReview && subtotal > 0 && (
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Deposit Required</span>
                  <span className="text-lg font-semibold text-white">${deposit.toFixed(2)}</span>
                </div>
                <p className="text-xs text-white/30 mt-1.5 leading-relaxed">
                  $250 deposit secures your service appointment and is applied to the final invoice.
                </p>
              </div>
            )}

            {/* Breakdown toggle */}
            {breakdown.length > 0 && (
              <details className="group">
                <summary className="px-6 py-3 text-xs font-medium text-[#00FFFF]/60 cursor-pointer hover:text-[#00FFFF]/80 transition-colors select-none flex items-center justify-between">
                  View Breakdown
                  <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-4 space-y-1 max-h-48 overflow-y-auto">
                  {breakdown.map((line, i) => (
                    <p
                      key={i}
                      className={`text-xs ${
                        line.startsWith("---")
                          ? "font-semibold text-[#00FFFF] mt-2 first:mt-0"
                          : "text-white/40"
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="px-6 py-5 space-y-2.5">
              <Button
                size="lg"
                className="w-full bg-[#00FFFF] text-black hover:bg-[#00FFFF]/90 font-semibold h-12 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                disabled={!canSubmit || isSubmitting}
                onClick={onSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : requiresManualReview ? (
                  "Submit for Review ($250 Deposit)"
                ) : (
                  "Pay $250 Deposit"
                )}
              </Button>

              {!requiresManualReview && subtotal > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full font-medium h-10 rounded-xl border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-sm"
                  disabled={isDownloadingPDF || !canSubmit}
                  onClick={onDownloadPDF}
                >
                  {isDownloadingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Quote as PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Trust signal */}
          <div className="mt-4 text-center">
            <p className="text-xs text-white/30">
              Serving Georgian Bay, Lake Simcoe, and Muskoka
            </p>
            <p className="text-[10px] text-white/20 mt-0.5">
              Trusted by boat owners across Ontario's premier boating regions.
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile: sticky bottom bar ── */}
      {hasItems && subtotal > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs text-white/40">Estimated Total</p>
              <AnimatedPrice value={subtotal} className="text-lg font-bold text-white" />
            </div>
            <Button
              className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/90 font-semibold rounded-xl px-6 h-10"
              disabled={!canSubmit || isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Pay Deposit"
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
