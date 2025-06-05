import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  name: string;
  maxRenders?: number;
}

interface State {
  hasError: boolean;
  renderCount: number;
  errorMessage?: string;
}

export class SafeWrapper extends Component<Props, State> {
  private renderCountInCycle = 0;
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      renderCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 Component ${this.props.name} crashed:`, {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  componentDidMount() {
    this.resetRenderCount();
  }

  componentDidUpdate() {
    const maxRenders = this.props.maxRenders || 100;
    this.renderCountInCycle++;

    if (this.renderCountInCycle > maxRenders) {
      console.error(
        `🚨 INFINITE LOOP: ${this.props.name} rendered ${this.renderCountInCycle} times!`
      );
      this.setState({
        hasError: true,
        errorMessage: `Infinite render loop detected (${this.renderCountInCycle} renders)`,
      });
      return;
    }

    // Reset counter after 1 second of no renders
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.resetTimer = setTimeout(() => {
      this.renderCountInCycle = 0;
    }, 1000);
  }

  componentWillUnmount() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  private resetRenderCount = () => {
    this.renderCountInCycle = 0;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 text-lg font-semibold text-red-800">
            Component Error: {this.props.name}
          </h3>
          <p className="mb-4 text-sm text-red-600">
            {this.state.errorMessage || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, renderCount: 0 });
              this.renderCountInCycle = 0;
            }}
            className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
