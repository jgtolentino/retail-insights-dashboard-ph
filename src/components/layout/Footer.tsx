import { useEffect, useState } from 'react';

export function Footer() {
  const [deployTime, setDeployTime] = useState<string>('');

  useEffect(() => {
    // Get build time from environment variable or use current time
    const buildTime = import.meta.env.VITE_BUILD_TIME || new Date().toISOString();
    const date = new Date(buildTime);

    // Format as M/D/YYYY h:mm AM/PM
    const options: Intl.DateTimeFormatOptions = {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila', // Philippine timezone
    };

    const formatted = date.toLocaleString('en-US', options);
    setDeployTime(formatted);
  }, []);

  return (
    <footer className="mt-auto border-t bg-gray-50 px-6 py-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Retail Insights Dashboard PH - Powered by Dlab</span>
        <span>Last updated: {deployTime}</span>
      </div>
    </footer>
  );
}
