/**
 * Production Monitoring and Alerting System
 * Tracks application health, performance metrics, and user interactions
 */

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorData {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface PerformanceData {
  metric: string;
  value: number;
  timestamp: number;
  page: string;
}

class ProductionMonitoring {
  private sessionId: string;
  private userId?: string;
  private isProduction: boolean;
  private metricsBuffer: MetricData[] = [];
  private errorBuffer: ErrorData[] = [];
  private performanceBuffer: PerformanceData[] = [];
  private flushInterval: number = 30000; // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = window.location.hostname !== 'localhost';
    
    if (this.isProduction) {
      this.initializeMonitoring();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring(): void {
    // Set up error tracking
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

    // Set up performance monitoring
    this.setupPerformanceObserver();

    // Set up periodic metrics flushing
    setInterval(() => this.flushMetrics(), this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flushMetrics());
  }

  private handleError(event: ErrorEvent): void {
    const errorData: ErrorData = {
      message: event.message,
      stack: event.error?.stack,
      url: event.filename || window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.errorBuffer.push(errorData);
    console.error('Tracked error:', errorData);
  }

  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const errorData: ErrorData = {
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.errorBuffer.push(errorData);
    console.error('Tracked promise rejection:', errorData);
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance(entry.name, entry.value || entry.duration);
        }
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (e) {
        console.warn('Performance observer not supported for some entry types');
      }
    }

    // Track Core Web Vitals
    this.trackWebVitals();
  }

  private trackWebVitals(): void {
    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.trackPerformance('fcp', entry.startTime);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // Fallback for older browsers
      }
    }

    // Largest Contentful Paint (LCP)
    if ('LargestContentfulPaint' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('lcp', lastEntry.startTime);
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Fallback
      }
    }
  }

  public trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metricsBuffer.push(metric);
    
    if (this.metricsBuffer.length >= 100) {
      this.flushMetrics();
    }
  }

  public trackPerformance(metric: string, value: number): void {
    const performanceData: PerformanceData = {
      metric,
      value,
      timestamp: Date.now(),
      page: window.location.pathname
    };

    this.performanceBuffer.push(performanceData);
  }

  public trackUserAction(action: string, details?: Record<string, any>): void {
    this.trackMetric('user_action', 1, {
      action,
      page: window.location.pathname,
      ...details
    });
  }

  public trackDashboardLoad(dashboard: string, loadTime: number): void {
    this.trackMetric('dashboard_load_time', loadTime, {
      dashboard,
      page: window.location.pathname
    });
  }

  public trackQueryPerformance(queryName: string, duration: number, success: boolean): void {
    this.trackMetric('query_performance', duration, {
      query: queryName,
      success: success.toString(),
      page: window.location.pathname
    });
  }

  public trackError(error: Error, context?: Record<string, any>): void {
    const errorData: ErrorData = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.errorBuffer.push(errorData);
    
    // Also track as metric
    this.trackMetric('application_error', 1, {
      error_type: error.name,
      ...context
    });
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  private async flushMetrics(): Promise<void> {
    if (!this.isProduction) return;

    const payload = {
      metrics: [...this.metricsBuffer],
      errors: [...this.errorBuffer],
      performance: [...this.performanceBuffer],
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href
    };

    // Clear buffers
    this.metricsBuffer = [];
    this.errorBuffer = [];
    this.performanceBuffer = [];

    try {
      // Send to monitoring endpoint
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Could implement local storage fallback here
    }
  }

  public createTimer(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance(name, duration);
    };
  }

  public async withMonitoring<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const timer = this.createTimer(operation);
    
    try {
      const result = await fn();
      this.trackMetric('operation_success', 1, { operation });
      timer();
      return result;
    } catch (error) {
      this.trackError(error as Error, { operation });
      this.trackMetric('operation_failure', 1, { operation });
      timer();
      throw error;
    }
  }
}

// Singleton instance
export const monitoring = new ProductionMonitoring();

// Health check utilities
export class HealthCheck {
  private checks: Map<string, () => Promise<boolean>> = new Map();

  public registerCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn);
  }

  public async runChecks(): Promise<{ healthy: boolean; checks: Record<string, boolean> }> {
    const results: Record<string, boolean> = {};
    let allHealthy = true;

    for (const [name, checkFn] of this.checks) {
      try {
        results[name] = await checkFn();
        if (!results[name]) {
          allHealthy = false;
        }
      } catch (error) {
        results[name] = false;
        allHealthy = false;
        monitoring.trackError(error as Error, { healthCheck: name });
      }
    }

    return { healthy: allHealthy, checks: results };
  }
}

export const healthCheck = new HealthCheck();

// Register default health checks
healthCheck.registerCheck('database', async () => {
  try {
    // Simple query to check database connectivity
    const response = await fetch('/api/health/database');
    return response.ok;
  } catch {
    return false;
  }
});

healthCheck.registerCheck('api', async () => {
  try {
    const response = await fetch('/api/health');
    return response.ok;
  } catch {
    return false;
  }
});

// Performance monitoring hooks for React components
export function usePerformanceTracking(componentName: string) {
  const timer = monitoring.createTimer(`component_render_${componentName}`);
  
  return {
    trackRender: timer,
    trackAction: (action: string) => {
      monitoring.trackUserAction(`${componentName}_${action}`);
    }
  };
}