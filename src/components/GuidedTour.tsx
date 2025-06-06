import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Book } from 'lucide-react';

interface TourStep {
  element?: string;
  intro: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  tourName: string;
  className?: string;
}

declare global {
  interface Window {
    introJs: any;
  }
}

export function GuidedTour({ steps, tourName, className = '' }: GuidedTourProps) {
  const startTour = () => {
    if (typeof window !== 'undefined' && window.introJs) {
      window
        .introJs()
        .setOptions({
          steps: steps,
          showProgress: true,
          showBullets: false,
          exitOnOverlayClick: false,
          exitOnEsc: true,
          nextLabel: 'Next →',
          prevLabel: '← Back',
          skipLabel: 'Skip Tour',
          doneLabel: 'Finish!',
        })
        .start();
    } else {
      }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        onClick={startTour}
        variant="outline"
        size="sm"
        className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
      >
        <Play className="mr-2 h-4 w-4" />
        Take a Tour
      </Button>
    </div>
  );
}

export function ProjectScoutTour() {
  const steps: TourStep[] = [
    {
      intro:
        '👋 Welcome to Project Scout! This is your IoT-powered retail insights dashboard. Let me walk you through the key features.',
    },
    {
      element: '[data-tour="overview-tab"]',
      intro:
        'Start here with the Overview tab to see system status, device metrics, and cost savings from our optimized architecture.',
    },
    {
      element: '[data-tour="active-devices"]',
      intro:
        'Monitor your active IoT devices in real-time. Currently ready for device registration and deployment.',
    },
    {
      element: '[data-tour="cost-savings"]',
      intro:
        'See the massive cost savings achieved by using Supabase + Vercel instead of Azure - 83% reduction in infrastructure costs!',
    },
    {
      element: '[data-tour="data-integrity"]',
      intro:
        'Learn about our data integrity solutions that solve device collision and corruption issues found in the original system.',
    },
    {
      element: '[data-tour="devices-tab"]',
      intro:
        'Switch to the IoT Devices tab to monitor device health, registration status, and performance metrics.',
    },
    {
      element: '[data-tour="ai-tab"]',
      intro:
        'The AI Insights tab provides Azure OpenAI-powered analytics and predictions for Filipino consumer behavior.',
    },
    {
      element: '[data-tour="analytics-tab"]',
      intro:
        'Enhanced Analytics shows real-time transaction monitoring and device-correlated customer behavior patterns.',
    },
    {
      element: '[data-tour="analytics-content"]',
      intro:
        'Here you can see live analytics! The Transaction Trends Chart shows hourly patterns, and below it is the Geospatial Heatmap displaying store performance across the Philippines with real IoT device data.',
    },
    {
      element: '[data-tour="architecture-tab"]',
      intro:
        'Finally, the Architecture tab explains our technical decisions and migration strategies.',
    },
    {
      intro:
        'That\'s the complete Project Scout tour! Remember, you can always click the "?" button in the bottom right to chat with ScoutBot for help. Happy exploring! 🚀',
    },
  ];

  return <GuidedTour steps={steps} tourName="Project Scout" />;
}
