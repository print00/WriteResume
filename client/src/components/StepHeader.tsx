import clsx from "clsx";

interface StepHeaderProps {
  steps: string[];
  currentStep: number;
  maxVisitedStep: number;
  onSelect: (step: number) => void;
}

export default function StepHeader({
  steps,
  currentStep,
  maxVisitedStep,
  onSelect,
}: StepHeaderProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-full bg-slate-900/70">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-accent to-sky-300 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-7">
        {steps.map((label, index) => {
          const isActive = index === currentStep;
          const isVisited = index <= maxVisitedStep;

          return (
            <button
              key={label}
              type="button"
              className={clsx(
                "rounded-2xl border px-3 py-3 text-left transition",
                isActive
                  ? "border-accent bg-accent/10 text-white shadow-glow"
                  : "border-line bg-panel/80 text-slate-300",
                isVisited ? "cursor-pointer hover:border-slate-400" : "cursor-not-allowed opacity-70",
              )}
              onClick={() => {
                if (isVisited) {
                  onSelect(index);
                }
              }}
              disabled={!isVisited}
            >
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Step {index + 1}
              </div>
              <div className="mt-1 text-sm font-semibold">{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
