import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";
import Spinner from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({
  children,
  className,
  loading,
  variant = "primary",
  disabled,
  type = "button",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-60",
        {
          "bg-accent text-ink shadow-lg shadow-accent/15 hover:bg-accentSoft": variant === "primary",
          "border border-white/10 bg-white/[0.06] text-slate-100 hover:border-accent/40 hover:bg-white/[0.09]": variant === "secondary",
          "text-slate-300 hover:bg-white/[0.05] hover:text-white": variant === "ghost",
        },
        className,
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
