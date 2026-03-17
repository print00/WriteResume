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
        className={`${compact ? "h-12 w-12" : "h-16 w-16"} rounded-xl object-contain`}
      />

      <div className="min-w-0">
        <div
          className={`bg-gradient-to-r from-[#1c4a8f] via-[#1288b7] to-[#13c9bf] bg-clip-text font-semibold tracking-tight text-transparent ${
            compact ? "text-2xl" : "text-4xl"
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
