"use client";

interface ScorePanelProps {
  retention: number;
  engagement: number;
  dimsExplored: number;
  estimatedScore: number;
}

export function ScorePanel({
  retention,
  engagement,
  dimsExplored,
  estimatedScore,
}: ScorePanelProps) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <h3 className="text-xs text-gray-500 tracking-widest mb-2">SCORE</h3>
      <div className="border border-gray-800 bg-black/50 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-600 tracking-widest mb-1">
              RETENTION
            </p>
            <p className="text-xl font-bold tracking-wider">
              {formatTime(retention)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 tracking-widest mb-1">
              ENGAGEMENT
            </p>
            <p className="text-xl font-bold tracking-wider">
              <span
                className={
                  engagement >= 1.5
                    ? "text-green-400"
                    : engagement >= 1.0
                      ? "text-gray-300"
                      : "text-red-400"
                }
              >
                {engagement.toFixed(1)}x
              </span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 tracking-widest mb-1">
              EXPLORATION
            </p>
            <p className="text-xl font-bold tracking-wider">
              {dimsExplored}
              <span className="text-gray-600">/5</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 tracking-widest mb-1">
              EST. SCORE
            </p>
            <p className="text-xl font-bold tracking-wider text-accent score-pulse">
              {estimatedScore.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Score formula hint */}
        <div className="border-t border-gray-800 pt-2">
          <p className="text-[9px] text-gray-700 font-mono">
            score = retention x engagement x exploration
          </p>
        </div>
      </div>
    </div>
  );
}
