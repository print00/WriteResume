import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

interface BaseProps {
  label: string;
  error?: string;
}

type InputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: "input";
  };

type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: "textarea";
  };

export default function FormField(props: InputProps | TextareaProps) {
  const { label, error, className, ...rest } = props;
  const sharedClasses = clsx(
    "w-full rounded-xl border border-line bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/30",
    className,
  );
  const inputProps = rest as InputHTMLAttributes<HTMLInputElement>;
  const textareaProps = rest as TextareaHTMLAttributes<HTMLTextAreaElement>;

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {props.as === "textarea" ? (
        <textarea className={sharedClasses} {...textareaProps} />
      ) : (
        <input className={sharedClasses} {...inputProps} />
      )}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
