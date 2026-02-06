"use client";

interface TextCardDisplayProps {
  content: string;
}

export function TextCardDisplay({ content }: TextCardDisplayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="text-card-enter bg-black/85 px-8 py-6 max-w-sm mx-4">
        <p className="font-mono text-white text-center text-base leading-relaxed tracking-wide">
          {content}
        </p>
      </div>
    </div>
  );
}
