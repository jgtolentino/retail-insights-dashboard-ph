import React from 'react';
import DatabricksGeniePanel from '@/components/DatabricksGeniePanel';

export default function DatabricksGenie() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Databricks AI Genie</h1>
        <p className="text-gray-600">
          Ask natural language questions about your Philippine retail data and get instant insights
          with visualizations.
        </p>
      </div>

      <DatabricksGeniePanel className="w-full" />

      <div className="mt-8 grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold text-blue-900">🎯 Sales Analysis</h3>
          <ul className="space-y-1 text-blue-700">
            <li>"What are our top 5 selling brands?"</li>
            <li>"Show me sales trends for the last 6 months"</li>
            <li>"Which region has the highest revenue?"</li>
          </ul>
        </div>

        <div className="rounded-lg bg-green-50 p-4">
          <h3 className="mb-2 font-semibold text-green-900">👥 Customer Insights</h3>
          <ul className="space-y-1 text-green-700">
            <li>"What's our customer age distribution?"</li>
            <li>"Which gender spends more on average?"</li>
            <li>"Show customer demographics by region"</li>
          </ul>
        </div>

        <div className="rounded-lg bg-purple-50 p-4">
          <h3 className="mb-2 font-semibold text-purple-900">🏢 TBWA Analysis</h3>
          <ul className="space-y-1 text-purple-700">
            <li>"Compare TBWA brands vs competitors"</li>
            <li>"How are our TBWA brands performing?"</li>
            <li>"Show TBWA market share by category"</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h3 className="mb-2 font-semibold text-yellow-900">💡 Tips for Better Results</h3>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• Be specific about time periods (e.g., "last month", "this year")</li>
          <li>• Ask for comparisons (e.g., "compare X vs Y")</li>
          <li>• Request specific metrics (e.g., "total revenue", "average transaction")</li>
          <li>• Use business terms like "brands", "customers", "sales", "transactions"</li>
        </ul>
      </div>
    </div>
  );
}
