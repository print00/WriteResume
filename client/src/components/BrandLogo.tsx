interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export default function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/WriteResumeLogo.png"
        alt="WriteResume logo"
        className={`${compact ? "h-12" : "h-20"} w-auto object-contain`}
      />

      {compact ? (
        <div className="min-w-0">
          <div className="text-2xl font-semibold tracking-tight text-white">WriteResume</div>
        </div>
      ) : null}
    </div>
  );
}
