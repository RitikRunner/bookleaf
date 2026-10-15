import { CheckCircle2, Circle } from "lucide-react";

const STAGES = [
  "Manuscript Received",
  "Editing",
  "Cover Design",
  "Typesetting",
  "Proofreading",
  "ISBN Assignment",
  "Printing",
  "Distribution Setup",
  "Published & Live"
];

interface ProductionStepperProps {
  currentStatus: string;
}

export function ProductionStepper({ currentStatus }: ProductionStepperProps) {
  // Determine index of current stage
  let activeIndex = STAGES.length - 1; // default to published
  if (currentStatus.includes("Cover Design")) {
    activeIndex = 2;
  } else if (currentStatus.includes("Typesetting")) {
    activeIndex = 3;
  } else if (currentStatus.includes("Editing")) {
    activeIndex = 1;
  } else if (currentStatus.includes("Proofreading")) {
    activeIndex = 4;
  } else if (currentStatus.includes("ISBN")) {
    activeIndex = 5;
  } else if (currentStatus.includes("Printing")) {
    activeIndex = 6;
  } else if (currentStatus.includes("Distribution")) {
    activeIndex = 7;
  }

  const isLive = currentStatus === "Published & Live";

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          BookLeaf Production Pipeline
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          isLive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`}>
          {currentStatus}
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[650px] justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-3 left-4 right-4 h-0.5 bg-slate-200 -z-0" />

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex || isLive;
            const isCurrent = idx === activeIndex && !isLive;

            return (
              <div key={stage} className="flex flex-col items-center text-center relative z-10 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isCurrent
                      ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                      : "bg-white border-2 border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[11px] leading-tight font-medium max-w-[70px] ${
                    isCurrent
                      ? "text-amber-900 font-bold"
                      : isCompleted
                      ? "text-slate-800 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
