import { useEffect, useRef } from 'react';

// Global render counter to prevent browser crashes
let globalRenderCount = 0;
let lastResetTime = Date.now();
const RESET_INTERVAL = 10000; // Reset counter every 10 seconds
const GLOBAL_RENDER_LIMIT = 2000; // Emergency limit
const COMPONENT_RENDER_LIMIT = 200; // Per-component limit

export function useEmergencyRenderLimit(componentName: string) {
  const componentRenderCount = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted.current) return;

    globalRenderCount++;
    componentRenderCount.current++;

    const now = Date.now();

    // Reset global counter periodically
    if (now - lastResetTime > RESET_INTERVAL) {
      globalRenderCount = 0;
      lastResetTime = now;
    }

    // Component-level emergency brake
    if (componentRenderCount.current > COMPONENT_RENDER_LIMIT) {
      console.error(`🚨 EMERGENCY: ${componentName} exceeded ${COMPONENT_RENDER_LIMIT} renders!`);

      // Reload page to prevent crash
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      throw new Error(`Emergency render limit exceeded in ${componentName}`);
    }

    // Global emergency brake
    if (globalRenderCount > GLOBAL_RENDER_LIMIT) {
      console.error(
        `🚨 GLOBAL EMERGENCY: ${GLOBAL_RENDER_LIMIT} total renders in ${RESET_INTERVAL / 1000}s!`
      );

      // Immediate page reload to prevent browser crash
      if (typeof window !== 'undefined') {
        window.location.reload();
      }

      throw new Error('Global emergency render limit exceeded');
    }
  });

  return {
    componentRenderCount: componentRenderCount.current,
    globalRenderCount,
    isNearLimit: componentRenderCount.current > COMPONENT_RENDER_LIMIT * 0.8,
    isNearGlobalLimit: globalRenderCount > GLOBAL_RENDER_LIMIT * 0.8,
  };
}
