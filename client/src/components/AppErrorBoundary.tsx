import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("WriteResume UI crash:", error, info);
    this.setState({ errorMessage: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-6 text-slate-100">
          <div className="surface max-w-xl rounded-lg border-danger/40 p-8">
            <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The app hit an unexpected error while rendering the form. Refresh the
              page to recover. If this keeps happening, the browser console will now
              show the exact crash.
            </p>
            {this.state.errorMessage ? (
              <pre className="mt-4 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-4 text-xs text-rose-200">
                {this.state.errorMessage}
              </pre>
            ) : null}
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
