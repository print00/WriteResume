interface BrandLogoProps {
  className?: string;
  compact?: boolean;
}

export default function BrandLogo({ className = "", compact = false }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 96 96"
        className={compact ? "h-12 w-12" : "h-16 w-16"}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="brand-gradient" x1="10%" x2="90%" y1="5%" y2="95%">
            <stop offset="0%" stopColor="#1dd3c6" />
            <stop offset="100%" stopColor="#16468e" />
          </linearGradient>
        </defs>
        <path
          d="M25 10h35l21 21v28c0 15-11 24-33 32C27 83 15 74 15 59V20c0-6 4-10 10-10Z"
          fill="none"
          stroke="url(#brand-gradient)"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <path
          d="M60 10v18c0 4 3 7 7 7h14"
          fill="none"
          stroke="url(#brand-gradient)"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <path
          d="M11 68c0-15 13-26 18-38"
          fill="none"
          stroke="url(#brand-gradient)"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <path
          d="M28 69 53 34 33 38l13 13-18 18Z"
          fill="url(#brand-gradient)"
        />
        <path d="M44 48h19" stroke="url(#brand-gradient)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M42 60h23" stroke="url(#brand-gradient)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M37 72h23" stroke="url(#brand-gradient)" strokeWidth="4.5" strokeLinecap="round" />
        <path
          d="M67 21l2.8 6.2 6.2 2.8-6.2 2.8-2.8 6.2-2.8-6.2-6.2-2.8 6.2-2.8Z"
          fill="#1dd3c6"
        />
        <circle cx="58" cy="16" r="2.8" fill="#1dd3c6" />
        <circle cx="69" cy="42" r="1.9" fill="#1dd3c6" />
      </svg>

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
