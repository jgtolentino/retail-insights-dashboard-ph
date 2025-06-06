import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useEmergencyRenderLimit } from '@/hooks/debugging/useEmergencyRenderLimit';

interface SafeWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
  maxRenders?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SafeWrapper extends React.Component<SafeWrapperProps, State> {
  constructor(props: SafeWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SafeWrapper caught error:', error, errorInfo);
  }

  render() {
    // Use the hook in a functional component wrapper
    const SafeWrapperContent = () => {
      useEmergencyRenderLimit(this.props.name || 'SafeWrapper');
      return this.props.children;
    };

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Component Error</span>
            </CardTitle>
            <CardDescription>
              This component encountered an error and is temporarily unavailable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-sm text-yellow-800 underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      );
    }

    return <SafeWrapperContent />;
  }
}
