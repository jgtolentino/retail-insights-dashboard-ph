import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  sprint: number;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class SprintErrorBoundary extends Component<Props, State> {
  private expectedErrors: Record<number, string[]> = {
    1: ['map of undefined', 'invalid date', 'cannot read property', 'unexpected "c"'],
    2: ['circular reference', 'division by zero', 'sankey', 'pareto'],
    3: ['funnel stages', 'null preferences', 'gesture', 'verbal'],
    4: ['invalid coordinates', 'google is not defined', 'latitude', 'longitude'],
    5: ['API key', 'rate limit', 'openai', 'insufficient data'],
  };

  private errorSolutions: Record<number, Record<string, string>> = {
    1: {
      'map of undefined': 'Check if time series data is properly loaded',
      'invalid date': 'Verify date format in transactions table',
      'unexpected "c"': 'Check Supabase query syntax and joins',
    },
    2: {
      'circular reference': 'Validate product substitution data',
      'division by zero': 'Add zero-value checks in calculations',
    },
    3: {
      'funnel stages': 'Ensure funnel data is sorted correctly',
      'null preferences': 'Add default values for preference data',
    },
    4: {
      'invalid coordinates': 'Validate store location data',
      'google is not defined': 'Check if Google Maps API is loaded',
    },
    5: {
      'API key': 'Add VITE_OPENAI_KEY to environment variables',
      'rate limit': 'Implement request throttling',
    },
  };

  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { sprint } = this.props;
    const errorMessage = error.message.toLowerCase();

    const isExpected = this.expectedErrors[sprint]?.some(msg => errorMessage.includes(msg));

    console.error(`Sprint ${sprint} Error (${isExpected ? 'Expected' : 'Unexpected'}):`, {
      error,
      errorInfo,
      sprint,
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production' && !isExpected) {
      // window.Sentry?.captureException(error, {
      //   contexts: { sprint: { number: sprint } }
      // });
    }

    this.setState({ errorInfo });
  }

  getSolution(): string | null {
    if (!this.state.error || !this.props.sprint) return null;

    const errorMessage = this.state.error.message.toLowerCase();
    const sprintSolutions = this.errorSolutions[this.props.sprint] || {};

    for (const [key, solution] of Object.entries(sprintSolutions)) {
      if (errorMessage.includes(key)) {
        return solution;
      }
    }

    return null;
  }

  render() {
    if (this.state.hasError) {
      const solution = this.getSolution();

      return (
        this.props.fallback || (
          <Card className="m-4 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Sprint {this.props.sprint} Feature Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-red-600">Error:</p>
                <p className="rounded bg-white p-2 font-mono text-sm text-gray-700">
                  {this.state.error?.message}
                </p>
              </div>

              {solution && (
                <div>
                  <p className="font-semibold text-blue-600">Suggested Solution:</p>
                  <p className="rounded bg-blue-50 p-2 text-sm text-gray-700">{solution}</p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Show Stack Trace
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Reload Page
                </Button>
                <Button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  variant="default"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
