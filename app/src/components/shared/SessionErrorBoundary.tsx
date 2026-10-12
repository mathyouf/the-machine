"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  sessionId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[SessionErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center px-6">
          <div className="text-center max-w-md space-y-4">
            <p className="text-xs text-gray-600 tracking-[0.3em]">THE MACHINE</p>
            <h2 className="text-xl text-white tracking-wider">Session Error</h2>
            <p className="text-sm text-gray-500">
              {this.state.error?.message || "Something went wrong during your session."}
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-2 border border-gray-700 text-gray-400 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
              >
                RETRY
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-6 py-2 text-gray-600 text-xs tracking-widest hover:text-gray-400 transition-all"
              >
                RETURN HOME
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
