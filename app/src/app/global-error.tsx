"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md px-6">
          <p className="text-xs text-gray-600 tracking-[0.3em]">THE MACHINE</p>
          <h2 className="text-xl tracking-wider">Something went wrong</h2>
          <p className="text-sm text-gray-500">{error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 border border-gray-700 text-gray-400 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
          >
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
