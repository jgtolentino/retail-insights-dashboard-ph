// Safe no-op fallback so "trackReason is not defined" never fires
export function trackReason(reason: string, meta: Record<string, any> = {}) {
  if (process.env.VITE_ENABLE_ANALYTICS !== 'true') return;
  // Put real analytics call here later
  /* eslint-disable-next-line no-console */
  console.debug('[analytics] reason:', reason, meta);
}

// Additional safe analytics exports
export function trackEvent(event: string, data: Record<string, any> = {}) {
  if (process.env.VITE_ENABLE_ANALYTICS !== 'true') return;
  console.debug('[analytics] event:', event, data);
}

export function trackPageView(page: string) {
  if (process.env.VITE_ENABLE_ANALYTICS !== 'true') return;
  console.debug('[analytics] pageview:', page);
}