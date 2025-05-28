import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enhanced global safety wrapper - catches ALL Array.from calls
const originalArrayFrom = Array.from;
(Array as any).from = function(arrayLike: any, mapFn?: any, thisArg?: any) {
  if (arrayLike === undefined || arrayLike === null) {
    console.group('⚠️ Array.from null/undefined warning');
    console.warn('Input:', arrayLike);
    console.warn('Type:', typeof arrayLike);
    console.warn('Stack trace:', new Error().stack?.split('\n').slice(2, 8).join('\n'));
    console.groupEnd();
    return [];
  }
  
  // Enhanced debugging for problematic cases
  if (typeof arrayLike === 'object' && arrayLike !== null) {
    if (!Array.isArray(arrayLike) && typeof arrayLike[Symbol.iterator] !== 'function') {
      console.group('🔍 Array.from potential issue');
      console.warn('Object passed to Array.from that may not be iterable');
      console.warn('Input:', arrayLike);
      console.warn('Type:', typeof arrayLike);
      console.warn('Constructor:', arrayLike.constructor?.name);
      console.warn('Keys:', Object.keys(arrayLike || {}));
      console.warn('Stack:', new Error().stack?.split('\n').slice(2, 6).join('\n'));
      console.groupEnd();
    }
  }
  
  try {
    const result = originalArrayFrom.call(this, arrayLike, mapFn, thisArg);
    return result;
  } catch (e) {
    console.group('❌ Array.from failed');
    console.error('Error:', e);
    console.error('Input was:', arrayLike);
    console.error('Input type:', typeof arrayLike);
    console.error('Input constructor:', arrayLike?.constructor?.name);
    console.error('Has Symbol.iterator:', typeof arrayLike?.[Symbol.iterator]);
    console.error('Stack:', new Error().stack);
    console.groupEnd();
    return [];
  }
};

// Global error handlers for debugging
window.addEventListener('error', (event) => {
  console.error('🚨 Global Error:', event.error)
  console.error('- Message:', event.message)
  console.error('- Filename:', event.filename)
  console.error('- Line:', event.lineno)
  console.error('- Column:', event.colno)
  console.error('- Stack:', event.error?.stack)
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason)
  console.error('- Promise:', event.promise)
});

// Enhanced app rendering with error handling
try {
  const root = createRoot(document.getElementById("root")!);
  console.log('🚀 Starting app render...');
  root.render(<App />);
  console.log('✅ App render initiated successfully');
} catch (error) {
  console.error('🚨 Failed to render app:', error);
  
  // Show a simple error message
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #dc2626;">Failed to Load Application</h1>
        <p>Check the browser console for details.</p>
        <pre style="background: #f3f4f6; padding: 10px; border-radius: 5px; text-align: left; overflow: auto;">
${error instanceof Error ? error.stack : String(error)}
        </pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}
