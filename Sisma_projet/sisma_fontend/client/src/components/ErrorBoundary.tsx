import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error) {
    // Avoid noisy console errors when React already logs stack traces.
    // Use console.error so it still appears in dev tools.
    console.error("UI error boundary caught:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">Une erreur est survenue</h1>
            <p className="text-gray-600 mt-2">
              Nous avons rencontré un problème inattendu. Vous pouvez rafraichir la page.
            </p>
            {this.state.errorMessage && (
              <pre className="mt-4 p-3 rounded-lg bg-gray-50 text-xs text-gray-600 overflow-auto">
                {this.state.errorMessage}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
