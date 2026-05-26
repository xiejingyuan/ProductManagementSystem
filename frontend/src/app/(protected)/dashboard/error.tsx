"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <p className="text-red-600 text-sm mb-4">{error.message}</p>
      <button onClick={reset} className="text-sm text-zinc-500 hover:text-black underline">
        Try again
      </button>
    </div>
  );
}
