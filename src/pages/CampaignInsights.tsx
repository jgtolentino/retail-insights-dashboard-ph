import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CESCampaignPanel from '@/components/CESCampaignPanel';
import {
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  Zap,
  Users,
  Eye,
  MousePointer,
  ShoppingCart,
  Award,
} from 'lucide-react';

export default function CampaignInsights() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              CES Campaign Analytics
            </h1>
            <p className="mt-2 text-gray-600">
              AI-powered campaign performance analysis with intelligent cost optimization
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Zap className="mr-1 h-4 w-4" />
            Powered by Azure OpenAI + PostgreSQL
          </Badge>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">CES Score</p>
                  <p className="text-2xl font-bold text-green-600">Analytics Ready</p>
                  <p className="text-xs text-gray-500">Conversion efficiency scoring</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Multi-Channel</p>
                  <p className="text-2xl font-bold text-blue-600">Attribution</p>
                  <p className="text-xs text-gray-500">Facebook, TikTok, Google+</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Cost Optimization</p>
                  <p className="text-2xl font-bold text-purple-600">60-80%</p>
                  <p className="text-xs text-gray-500">Savings vs GPT-4 only</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Intelligent</p>
                  <p className="text-2xl font-bold text-orange-600">Routing</p>
                  <p className="text-xs text-gray-500">Model selection by complexity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            What You Can Analyze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">CES Score Analysis</h3>
              </div>
              <p className="text-sm text-gray-600">
                Conversion Efficiency Score (CES) = (conversions ÷ impressions) × 1000
              </p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• Track CES trends over time</li>
                <li>• Compare campaigns and channels</li>
                <li>• Identify optimization opportunities</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Channel Performance</h3>
              </div>
              <p className="text-sm text-gray-600">
                Cross-channel attribution and performance comparison
              </p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• Facebook vs TikTok vs Google</li>
                <li>• Cost-per-conversion analysis</li>
                <li>• Channel-specific optimization</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">ROI & Spend Analysis</h3>
              </div>
              <p className="text-sm text-gray-600">
                Budget optimization and return on ad spend tracking
              </p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• ROAS by campaign and channel</li>
                <li>• Budget allocation recommendations</li>
                <li>• Spend efficiency analysis</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Trend Analysis</h3>
              </div>
              <p className="text-sm text-gray-600">Time-series analysis for performance trends</p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• Daily, weekly, monthly trends</li>
                <li>• Seasonal performance patterns</li>
                <li>• Predictive insights</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold">Audience Insights</h3>
              </div>
              <p className="text-sm text-gray-600">Demographic and behavioral analysis</p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• Age and gender performance</li>
                <li>• Geographic insights</li>
                <li>• Interest-based segments</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Conversion Funnel</h3>
              </div>
              <p className="text-sm text-gray-600">End-to-end conversion path analysis</p>
              <ul className="space-y-1 text-xs text-gray-500">
                <li>• Impression → Click → Conversion</li>
                <li>• Drop-off point identification</li>
                <li>• Funnel optimization recommendations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Example Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Sample Questions to Get Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">CES Score Analysis</h4>
              <ul className="space-y-1 text-sm">
                <li>• "What was the CES score trend for Campaign X over the last 90 days?"</li>
                <li>• "Which campaigns have the highest CES scores this month?"</li>
                <li>• "Show CES score distribution across all active campaigns"</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-blue-600">Channel Comparison</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Compare cost-per-conversion of TikTok vs Meta last month"</li>
                <li>• "Which channel has the best conversion rate?"</li>
                <li>• "Show cross-channel campaign attribution"</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-purple-600">Performance Optimization</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Which campaigns have the highest ROI?"</li>
                <li>• "Analyze conversion funnel performance"</li>
                <li>• "Show budget allocation recommendations"</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-orange-600">Trend Analysis</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Compare weekend vs weekday campaign performance"</li>
                <li>• "Show seasonal performance patterns"</li>
                <li>• "Analyze campaign performance trends over time"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main CES Campaign Analytics Panel */}
      <CESCampaignPanel defaultTenant="ces" />

      {/* Technical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Technical Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Azure PostgreSQL</h4>
              <p className="text-sm text-gray-600">
                Multi-tenant database with Row Level Security (RLS) for data isolation
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Intelligent Routing</h4>
              <p className="text-sm text-gray-600">
                Automatically selects GPT-3.5-turbo, GPT-3.5-turbo-16k, or GPT-4 based on query
                complexity
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Vercel Serverless</h4>
              <p className="text-sm text-gray-600">
                Scalable API endpoints with built-in tenant isolation and cost tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
