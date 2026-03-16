export default function InlineErrorBanner({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-rose-100">
      {message}
    </div>
  );
}
