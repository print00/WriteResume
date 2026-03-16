export default function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const classes =
    size === "md" ? "h-5 w-5 border-2" : "h-4 w-4 border-2";

  return (
    <span
      className={`${classes} inline-block animate-spin rounded-full border-current border-t-transparent`}
      aria-hidden="true"
    />
  );
}
