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
    <div className="surface rounded-lg p-4">
      <div className="overflow-hidden rounded-full bg-black/30">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-accent via-accentSoft to-gold transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-7">
        {steps.map((label, index) => {
          const isActive = index === currentStep;
          const isVisited = index <= maxVisitedStep;

          return (
            <button
              key={label}
              type="button"
              className={clsx(
                "rounded-lg border px-3 py-3 text-left transition",
                isActive
                  ? "border-accent/60 bg-accent/10 text-white shadow-glow"
                  : "border-white/10 bg-white/[0.035] text-slate-300",
                isVisited ? "cursor-pointer hover:border-accent/40 hover:bg-white/[0.06]" : "cursor-not-allowed opacity-60",
              )}
              onClick={() => {
                if (isVisited) {
                  onSelect(index);
                }
              }}
              disabled={!isVisited}
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-400">
                <span>Step {index + 1}</span>
                <span className={isActive ? "text-accent" : isVisited ? "text-success" : "text-slate-600"}>
                  {isActive ? "Now" : isVisited ? "Done" : "Locked"}
                </span>
              </div>
              <div className="mt-1 text-sm font-semibold">{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
