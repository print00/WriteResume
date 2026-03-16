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
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/60 focus:ring-offset-2 focus:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-60",
        {
          "bg-accent text-ink hover:bg-sky-300": variant === "primary",
          "border border-line bg-panel/80 text-slate-100 hover:bg-slate-800": variant === "secondary",
          "text-slate-300 hover:text-white": variant === "ghost",
        },
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
