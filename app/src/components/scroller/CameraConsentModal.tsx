"use client";

interface CameraConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function CameraConsentModal({
  onAccept,
  onDecline,
}: CameraConsentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-lg border border-gray-800 bg-black p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-wider mb-2">
            CAMERA ACCESS REQUIRED
          </h2>
          <p className="text-sm text-gray-500">
            The Machine needs to see your reactions
          </p>
        </div>

        <div className="space-y-4 mb-6 text-sm text-gray-400 leading-relaxed">
          <p>
            As the <span className="text-accent font-bold">SCROLLER</span>, your
            facial expressions and reactions will be captured and shown to your
            Optimizer partner in real-time.
          </p>

          <div className="border-l-2 border-accent/30 pl-4 space-y-2">
            <p className="text-xs text-gray-600 tracking-wider">WHAT WE COLLECT:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Live camera frames during the session (not recorded)</li>
              <li>Your scroll behavior and dwell times</li>
              <li>Session interaction data</li>
            </ul>
          </div>

          <div className="border-l-2 border-accent/30 pl-4 space-y-2">
            <p className="text-xs text-gray-600 tracking-wider">DATA RETENTION:</p>
            <p className="text-xs">
              Camera frames are transmitted in real-time and{" "}
              <span className="text-white font-bold">not permanently stored</span>.
              Behavioral data is retained for research and leaderboard purposes.
              You can request deletion at any time.
            </p>
          </div>

          <p className="text-xs text-gray-600">
            By accepting, you consent to this data collection as part of The
            Machine experiment. You can end the session at any time.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 bg-accent text-black font-bold py-3 tracking-wider hover:bg-accent/80 transition-all"
          >
            I CONSENT
          </button>
          <button
            onClick={onDecline}
            className="flex-1 border border-gray-800 py-3 text-sm tracking-wider hover:border-red-500/50 hover:text-red-400 transition-all"
          >
            DECLINE
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-700 text-center">
          experiments.dating research study
        </p>
      </div>
    </div>
  );
}
