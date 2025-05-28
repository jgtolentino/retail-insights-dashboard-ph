import { useEffect, useState } from 'react';
import { SprintErrorBoundary } from '@/utils/error-boundary-sprint';
import { runPreSprintChecks, displayValidationResults } from '@/utils/pre-sprint-checks';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SprintDashboardProps {
  sprint: number;
  children: React.ReactNode;
}

export function SprintDashboard({ sprint, children }: SprintDashboardProps) {
  const [validationStatus, setValidationStatus] = useState<{
    loading: boolean;
    passed: boolean;
    errors: string[];
    warnings: string[];
  }>({
    loading: true,
    passed: false,
    errors: [],
    warnings: []
  });

  useEffect(() => {
    async function validate() {
      try {
        const results = await runPreSprintChecks(sprint);
        setValidationStatus({
          loading: false,
          ...results
        });
        
        // Log results in development
        if (process.env.NODE_ENV === 'development') {
          displayValidationResults(results);
        }
      } catch (error) {
        setValidationStatus({
          loading: false,
          passed: false,
          errors: ['Failed to run validation checks'],
          warnings: []
        });
      }
    }

    validate();
  }, [sprint]);

  if (validationStatus.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validating Sprint {sprint} requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Status Alert */}
      {!validationStatus.passed && validationStatus.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sprint {sprint} Validation Failed</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {(validationStatus.errors ?? []).map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationStatus.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sprint {sprint} Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {(validationStatus.warnings ?? []).map((warning, index) => (
                <li key={index} className="text-sm">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validationStatus.passed && validationStatus.errors.length === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Sprint {sprint} Ready</AlertTitle>
          <AlertDescription className="text-green-700">
            All requirements validated successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Wrapped Content with Error Boundary */}
      <SprintErrorBoundary sprint={sprint}>
        {children}
      </SprintErrorBoundary>
    </div>
  );
}