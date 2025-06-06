import { useEffect, useRef } from 'react';

const RENDER_LIMIT = 50; // Maximum number of renders before emergency stop

export function useEmergencyRenderLimit(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    
    if (renderCount.current > RENDER_LIMIT) {
      console.error(`🚨 EMERGENCY STOP: ${componentName} exceeded render limit of ${RENDER_LIMIT}`);
      // Force component to stop rendering
      throw new Error(`Infinite render loop detected in ${componentName}`);
    }

    return () => {
      renderCount.current = 0;
    };
  });
} 