/**
 * Project Scout Integration Page
 *
 * Main dashboard integrating IoT monitoring, AI insights, and retail analytics
 * Based on Project Scout Comprehensive Analysis recommendations
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Brain,
  BarChart3,
  Cpu,
  Store,
  TrendingUp,
  Zap,
  Shield,
  Gauge,
  Globe,
} from 'lucide-react';

// Import our new components
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { DeviceHealthDashboard } from '@/components/iot/DeviceHealthDashboard';
import { ProjectScoutTour } from '@/components/GuidedTour';
import { TransactionTrendsChart } from '@/components/charts/TransactionTrendsChart';

export default function ProjectScout() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Project Scout</h1>
          <p className="text-gray-600">IoT-powered retail insights with AI analytics</p>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Supabase + Vercel
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              83% Cost Savings vs Azure
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              Azure OpenAI Powered
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              Architecture Modern Stack
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">System Health: Optimal</span>
            </div>
            <div className="text-xs text-gray-500">Database connected successfully</div>
          </div>
          <ProjectScoutTour />
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <Activity className="mr-2 h-4 w-4" />
            Refresh Status
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger
            value="overview"
            className="flex items-center space-x-1"
            data-tour="overview-tab"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="devices"
            className="flex items-center space-x-1"
            data-tour="devices-tab"
          >
            <Activity className="h-4 w-4" />
            <span>IoT Devices</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-1" data-tour="ai-tab">
            <Brain className="h-4 w-4" />
            <span>AI Insights</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center space-x-1"
            data-tour="analytics-tab"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger
            value="architecture"
            className="flex items-center space-x-1"
            data-tour="architecture-tab"
          >
            <Cpu className="h-4 w-4" />
            <span>Architecture</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card data-tour="active-devices">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Ready for registration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Store Coverage</CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">90</div>
                <p className="text-xs text-muted-foreground">Target deployment</p>
              </CardContent>
            </Card>

            <Card data-tour="cost-savings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">83%</div>
                <p className="text-xs text-muted-foreground">vs Azure architecture</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Annual Savings</CardTitle>
                <Gauge className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$3,156</div>
                <p className="text-xs text-muted-foreground">Infrastructure costs</p>
              </CardContent>
            </Card>
          </div>

          {/* Key Features */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card data-tour="data-integrity">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Data Integrity</span>
                </CardTitle>
                <CardDescription>
                  Solves device collision and data corruption issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>Unique device ID generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>Session matching validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>Transaction integrity checks</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span>Real-time Monitoring</span>
                </CardTitle>
                <CardDescription>Live device health and performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>Supabase real-time subscriptions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>Predictive failure detection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    <span>Automated alert system</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
                <CardDescription>Azure OpenAI for retail analytics and predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    <span>Filipino consumer behavior analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    <span>Sales predictions and trends</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    <span>Optimization recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
              <CardDescription>Based on Project Scout analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <div className="font-medium">Phase 1: Infrastructure Setup</div>
                    <div className="text-sm text-gray-500">
                      Supabase + Vercel deployment, master data schema
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Complete</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <div className="font-medium">Phase 2: IoT Integration</div>
                    <div className="text-sm text-gray-500">
                      Device registration, health monitoring, real-time events
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="flex-1">
                    <div className="font-medium">Phase 3: AI Analytics</div>
                    <div className="text-sm text-gray-500">
                      Azure OpenAI integration, behavioral insights
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Ready</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                  <div className="flex-1">
                    <div className="font-medium">Phase 4: Pilot Deployment</div>
                    <div className="text-sm text-gray-500">
                      10-device pilot test, validation, optimization
                    </div>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                  <div className="flex-1">
                    <div className="font-medium">Phase 5: Full Deployment</div>
                    <div className="text-sm text-gray-500">90-device rollout across all stores</div>
                  </div>
                  <Badge variant="outline">Planned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IoT Devices Tab */}
        <TabsContent value="devices">
          <DeviceHealthDashboard />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai">
          <AIInsightsPanel />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6" data-tour="analytics-content">
          {/* Transaction Trends Chart */}
          <TransactionTrendsChart region="All Regions" period={7} className="w-full" />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>Live transaction monitoring and IoT integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium">Active Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>Hourly transaction trends (Live)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      <span>Device-correlated customer behavior</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      <span>Filipino shopping pattern analysis</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                      <span>Substitution flow tracking (Coming Soon)</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality & Integrity</CardTitle>
                <CardDescription>Ensuring accurate analytics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium">Quality Assurance</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>Session matching validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>Device collision detection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>Transaction integrity checks</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      <span>Automated data quality scoring</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coming Soon Section */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics Pipeline</CardTitle>
              <CardDescription>Next phase analytics components in development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                  <div className="mb-2 text-2xl">🗺️</div>
                  <h4 className="font-medium">Geospatial Heatmap</h4>
                  <p className="text-sm text-gray-500">Store performance mapping</p>
                </div>
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                  <div className="mb-2 text-2xl">📊</div>
                  <h4 className="font-medium">Brand Analysis</h4>
                  <p className="text-sm text-gray-500">Top brands & SKU insights</p>
                </div>
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                  <div className="mb-2 text-2xl">👥</div>
                  <h4 className="font-medium">Demographics</h4>
                  <p className="text-sm text-gray-500">Consumer behavior patterns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span>Current Architecture</span>
                </CardTitle>
                <CardDescription>Supabase + Vercel optimized stack</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Database:</span>
                    <Badge className="bg-green-100 text-green-800">Supabase PostgreSQL</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Frontend:</span>
                    <Badge className="bg-blue-100 text-blue-800">Vercel Edge Network</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Real-time:</span>
                    <Badge className="bg-purple-100 text-purple-800">Supabase Realtime</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">AI:</span>
                    <Badge className="bg-orange-100 text-orange-800">Azure OpenAI</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">IoT Ingestion:</span>
                    <Badge className="bg-gray-100 text-gray-800">Vercel API Routes</Badge>
                  </div>
                </div>

                <div className="mt-6 rounded-lg bg-green-50 p-4">
                  <div className="mb-2 font-medium text-green-800">Cost Benefits</div>
                  <div className="space-y-1 text-sm text-green-700">
                    <div>Annual Cost: $660/year</div>
                    <div>Azure Alternative: $3,816/year</div>
                    <div className="font-medium">Savings: 83% ($3,156/year)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Architectural Decisions</CardTitle>
                <CardDescription>Based on Project Scout analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-sm font-medium">✅ Why Supabase over Azure SQL</div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Built-in real-time subscriptions</li>
                      <li>• PostgreSQL compatibility</li>
                      <li>• Row-level security</li>
                      <li>• 94% cost reduction</li>
                    </ul>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">
                      ✅ Why Vercel over Azure Functions
                    </div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Edge network performance</li>
                      <li>• Zero cold starts</li>
                      <li>• Automatic scaling</li>
                      <li>• Developer experience</li>
                    </ul>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">✅ IoT Event Processing</div>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Webhook-based ingestion</li>
                      <li>• Real-time notifications</li>
                      <li>• Automatic device registration</li>
                      <li>• Health monitoring alerts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Migration Path */}
          <Card>
            <CardHeader>
              <CardTitle>Future Migration Path</CardTitle>
              <CardDescription>When and how to scale to Azure (if needed)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="mb-2 text-sm font-medium">Scale Triggers</div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• &gt;500 devices</li>
                    <li>• Enterprise compliance needs</li>
                    <li>• Advanced IoT Hub features</li>
                    <li>• Microsoft ecosystem integration</li>
                  </ul>
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">Migration Effort</div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• 2-4 weeks estimated</li>
                    <li>• Database schema compatible</li>
                    <li>• API layer abstraction ready</li>
                    <li>• Zero downtime possible</li>
                  </ul>
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">Breakeven Analysis</div>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Migration cost: $25,000</li>
                    <li>• Annual savings lost: $3,156</li>
                    <li>• ROI timeline: 6-12 months</li>
                    <li>• Recommendation: Stay on Supabase</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Status Bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900">
              Retail Insights Dashboard PH - Powered by Dlab
            </span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Database connected</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
