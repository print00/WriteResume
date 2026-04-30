import {
  forwardRef,
  type InputHTMLAttributes,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
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

const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps | TextareaProps
>(function FormField(props, ref) {
  const { label, error, className, ...rest } = props;
  const sharedClasses = clsx(
    "field-shell w-full rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-accent focus:ring-2 focus:ring-accent/30",
    className,
  );
  const inputProps = rest as InputHTMLAttributes<HTMLInputElement>;
  const textareaProps = rest as TextareaHTMLAttributes<HTMLTextAreaElement>;

  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</span>
      {props.as === "textarea" ? (
        <textarea
          className={sharedClasses}
          ref={ref as Ref<HTMLTextAreaElement>}
          {...textareaProps}
        />
      ) : (
        <input
          className={sharedClasses}
          ref={ref as Ref<HTMLInputElement>}
          {...inputProps}
        />
      )}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
});

export default FormField;
