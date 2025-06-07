import React from 'react';
import SystemHealthMonitor from './SystemHealthMonitor';
import WhatsHappeningCard from './WhatsHappeningCard';
import WhyHappeningCard from './WhyHappeningCard';
import RegionalPerformanceCard from './RegionalPerformanceCard';

const DashboardOverview: React.FC = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Row 1 */}
        <WhatsHappeningCard />
        <WhyHappeningCard />
        <RegionalPerformanceCard />

        {/* Row 2: full-width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <SystemHealthMonitor />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;