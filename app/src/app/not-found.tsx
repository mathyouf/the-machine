import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 sacred-geometry-bg">
      <div className="text-center max-w-md">
        <p className="text-xs text-gray-600 tracking-[0.3em] mb-6">THE MACHINE</p>
        <h1 className="text-6xl font-bold text-accent glow-text mb-4">404</h1>
        <p className="text-gray-400 text-sm mb-8 tracking-wider">
          This page doesn&apos;t exist. The Machine only shows you what it wants you to see.
        </p>
        <Link
          href="/"
          className="px-8 py-3 border border-gray-700 text-gray-400 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
        >
          RETURN HOME
        </Link>
      </div>
    </div>
  );
}
