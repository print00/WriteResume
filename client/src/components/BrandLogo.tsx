interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export default function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/Logo.png"
        alt="WriteResume logo"
        className={`${compact ? "h-11 w-11" : "h-14 w-14"} rounded-lg border border-white/10 bg-white/[0.03] object-contain shadow-lift`}
      />

      <div className="min-w-0">
        <div
          className={`bg-gradient-to-r from-white via-accentSoft to-gold bg-clip-text font-semibold tracking-tight text-transparent ${
            compact ? "text-2xl" : "text-4xl md:text-5xl"
          }`}
        >
          WriteResume
        </div>
        {!compact ? (
          <div className="mt-1 text-sm tracking-[0.18em] text-slate-400">
            AI-POWERED RESUME BUILDER
          </div>
        ) : null}
      </div>
    </div>
  );
}
