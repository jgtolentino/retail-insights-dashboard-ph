import { useEffect, useRef } from 'react';

interface RenderMonitorOptions {
  maxRenders?: number;
  warnThreshold?: number;
  enabled?: boolean;
}

export function useRenderMonitor(componentName: string, options: RenderMonitorOptions = {}) {
  const {
    maxRenders = 100,
    warnThreshold = 50,
    enabled = process.env.NODE_ENV === 'development',
  } = options;

  const renderCount = useRef(0);
  const renderReasons = useRef<Set<string>>(new Set());
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    renderTimes.current.push(timeSinceLastRender);

    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current = renderTimes.current.slice(-10);
    }

    // Warning threshold
    if (renderCount.current === warnThreshold) {
      console.warn(`⚠️ ${componentName} has rendered ${warnThreshold} times!`);
      console.table({
        'Render Count': renderCount.current,
        'Avg Render Interval':
          Math.round(renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length) +
          'ms',
        Reasons: Array.from(renderReasons.current).join(', ') || 'None tracked',
      });
    }

    // Emergency threshold
    if (renderCount.current >= maxRenders) {
      console.error(`🔥 EMERGENCY: ${componentName} rendered ${renderCount.current} times!`);
      console.error('🚨 This indicates an infinite loop. Component details:');
      console.table({
        Component: componentName,
        'Render Count': renderCount.current,
        'Total Reasons': renderReasons.current.size,
        'Render Reasons': Array.from(renderReasons.current).join(', ') || 'None tracked',
        'Avg Render Time':
          Math.round(renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length) +
          'ms',
      });

      // Auto-report to error tracking if available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureMessage(`Excessive renders in ${componentName}`, {
          level: 'error',
          extra: {
            renderCount: renderCount.current,
            renderReasons: Array.from(renderReasons.current),
            avgRenderInterval:
              renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length,
          },
        });
      }

      // Return emergency JSX to prevent further renders
      throw new Error(
        `Infinite loop detected in ${componentName} (${renderCount.current} renders)`
      );
    }
  });

  const trackReason = (reason: string) => {
    if (enabled) {
      renderReasons.current.add(reason);
    }
  };

  const trackProps = (props: Record<string, any>, prevProps?: Record<string, any>) => {
    if (!enabled || !prevProps) return;

    Object.keys(props).forEach(key => {
      if (props[key] !== prevProps[key]) {
        trackReason(`prop:${key}`);
      }
    });
  };

  const trackState = (state: Record<string, any>, prevState?: Record<string, any>) => {
    if (!enabled || !prevState) return;

    Object.keys(state).forEach(key => {
      if (state[key] !== prevState[key]) {
        trackReason(`state:${key}`);
      }
    });
  };

  return {
    renderCount: renderCount.current,
    trackReason,
    trackProps,
    trackState,
    getReport: () => ({
      componentName,
      renderCount: renderCount.current,
      reasons: Array.from(renderReasons.current),
      avgRenderInterval:
        renderTimes.current.length > 0
          ? Math.round(renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length)
          : 0,
    }),
  };
}
