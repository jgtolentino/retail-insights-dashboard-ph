// Sentry is optional for this build - using console logging instead
const Sentry = null;
const BrowserTracing = null;

export function initSentry() {
  // Only initialize in production and if Sentry is available
  if (Sentry && import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException;

          // Don't send network errors for specific domains
          if (error?.message?.includes('NetworkError')) {
            return null;
          }

          // Don't send canceled requests
          if (error?.message?.includes('AbortError')) {
            return null;
          }
        }

        return event;
      },
    });
  }
}

// Wrapper for error logging with context
export function logError(error: Error, context?: Record<string, any>) {
  if (Sentry && import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  }
}

// Log specific data fetching errors
export function logDataFetchError(operation: string, error: Error, filters?: Record<string, any>) {
  const context = {
    operation,
    filters,
    timestamp: new Date().toISOString(),
  };

  logError(error, context);
}
