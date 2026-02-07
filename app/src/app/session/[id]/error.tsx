"use client";

export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-md space-y-4">
        <p className="text-xs text-gray-600 tracking-[0.3em]">THE MACHINE</p>
        <h2 className="text-xl text-white tracking-wider">Session Error</h2>
        <p className="text-sm text-gray-500">
          {error?.message || "Something went wrong during your session."}
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <button
            onClick={reset}
            className="px-6 py-2 border border-gray-700 text-gray-400 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
          >
            RETRY
          </button>
          <a
            href="/"
            className="px-6 py-2 text-gray-600 text-xs tracking-widest hover:text-gray-400 transition-all"
          >
            RETURN HOME
          </a>
        </div>
      </div>
    </div>
  );
}
