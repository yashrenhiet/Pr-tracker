import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "../Button";
import { Card } from "../Card";
import { StatePanel } from "../StatePanel";

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Without this, any render-time exception unmounts the whole React tree and the customer is left
 * staring at a blank white page with no way back. Class component because React still has no hook
 * equivalent for `componentDidCatch`.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <Card>
        <StatePanel
          tone="error"
          icon={<TriangleAlert size={24} />}
          title="Something went wrong on this page"
          description="The error has been logged. Reloading usually fixes it; your saved data is not affected."
          action={
            <Button type="button" variant="primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} aria-hidden="true" />
              Reload page
            </Button>
          }
        />
      </Card>
    );
  }
}
