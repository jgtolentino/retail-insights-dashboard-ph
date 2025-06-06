/**
 * AI Insights Page
 *
 * "What will happen next?" - Predictive analytics and intelligent recommendations
 * Advanced AI-powered insights, forecasting, and strategic recommendations for business optimization
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  Target,
  Users,
  Package,
  Copy,
  Download,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Calendar,
  Eye,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'predictive' | 'sales' | 'inventory' | 'marketing' | 'operations' | 'customer';
  confidence: number;
  impact: string;
  actionItems: string[];
  timeline: string;
  metrics?: {
    potential_revenue?: number;
    efficiency_gain?: number;
    cost_reduction?: number;
    roi_percentage?: number;
  };
}

const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    title: 'Predicted Stock Shortage Alert - Marlboro Red QC South',
    description:
      'AI models predict 95% probability of Marlboro Red stockout in QC South within 3 days based on consumption patterns and current inventory levels.',
    priority: 'critical',
    category: 'predictive',
    confidence: 95,
    impact: 'Prevent ₱127,000 revenue loss',
    timeline: 'Immediate action required',
    actionItems: [
      'Emergency restock: 500 packs Marlboro Red for QC South',
      'Activate alternative product recommendations',
      'Notify customers of potential substitutes',
      'Implement dynamic pricing to slow consumption',
    ],
    metrics: {
      potential_revenue: 127000,
      efficiency_gain: 23,
    },
  },
  {
    id: '2',
    title: 'Cross-Selling Opportunity: Snacks + Beverages Bundle',
    description:
      'Machine learning analysis reveals 89% correlation between snack and beverage purchases between 2-5 PM. Implementing targeted bundles could increase basket size.',
    priority: 'high',
    category: 'sales',
    confidence: 89,
    impact: 'Increase average basket value by 34%',
    timeline: 'Implementation within 1 week',
    actionItems: [
      'Create afternoon snack + drink combo promotions',
      'Position complementary items adjacent in stores',
      'Launch targeted mobile app notifications',
      'Train staff on suggestive selling techniques',
    ],
    metrics: {
      potential_revenue: 89000,
      efficiency_gain: 34,
      roi_percentage: 156,
    },
  },
  {
    id: '3',
    title: 'Customer Churn Risk: Metro Manila Segment',
    description:
      'Predictive models identify 78 high-value customers in Metro Manila showing early churn indicators. Proactive retention strategies recommended.',
    priority: 'high',
    category: 'customer',
    confidence: 82,
    impact: 'Retain ₱245,000 annual customer value',
    timeline: '2 weeks implementation',
    actionItems: [
      'Deploy personalized retention offers',
      'Implement loyalty point acceleration',
      'Schedule customer satisfaction surveys',
      'Create VIP customer experience program',
    ],
    metrics: {
      potential_revenue: 245000,
      cost_reduction: 67000,
    },
  },
  {
    id: '4',
    title: 'Seasonal Demand Forecast: Holiday Preparations',
    description:
      'Advanced forecasting indicates 145% increase in gift basket categories during December. Inventory optimization and staffing adjustments needed.',
    priority: 'medium',
    category: 'operations',
    confidence: 91,
    impact: 'Capture ₱340,000 seasonal opportunity',
    timeline: 'Plan for next 6 weeks',
    actionItems: [
      'Increase holiday product inventory by 145%',
      'Schedule additional temporary staff',
      'Create holiday marketing campaign',
      'Set up gift wrapping service stations',
    ],
    metrics: {
      potential_revenue: 340000,
      efficiency_gain: 28,
    },
  },
  {
    id: '5',
    title: 'Price Optimization: Premium Brand Strategy',
    description:
      'AI analysis suggests premium brands have 23% price elasticity room in CALABARZON region, enabling margin improvement without volume loss.',
    priority: 'medium',
    category: 'marketing',
    confidence: 76,
    impact: 'Improve margins by ₱156,000 annually',
    timeline: 'Gradual rollout over 4 weeks',
    actionItems: [
      'Implement A/B testing for price points',
      'Monitor customer response metrics',
      'Adjust pricing based on regional sensitivity',
      'Create value proposition messaging',
    ],
    metrics: {
      potential_revenue: 156000,
      roi_percentage: 189,
    },
  },
];

export default function AIInsights() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Filter insights based on selections
  const filteredInsights = useMemo(() => {
    return mockAIInsights.filter(insight => {
      const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory;
      const priorityMatch = selectedPriority === 'all' || insight.priority === selectedPriority;
      return categoryMatch && priorityMatch;
    });
  }, [selectedCategory, selectedPriority]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenuePotential = filteredInsights.reduce(
      (sum, insight) => sum + (insight.metrics?.potential_revenue || 0),
      0
    );
    const avgConfidence =
      filteredInsights.reduce((sum, insight) => sum + insight.confidence, 0) /
      filteredInsights.length;

    return {
      totalInsights: filteredInsights.length,
      criticalAlerts: filteredInsights.filter(i => i.priority === 'critical').length,
      totalRevenuePotential,
      avgConfidence: Math.round(avgConfidence),
    };
  }, [filteredInsights]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Insight details copied successfully',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'predictive':
        return <Eye className="h-4 w-4" />;
      case 'sales':
        return <TrendingUp className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'marketing':
        return <Target className="h-4 w-4" />;
      case 'operations':
        return <BarChart3 className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Power BI Style Header - "What will happen next?" Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
            <Brain className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">What Will Happen Next?</h1>
            <p className="text-lg font-medium text-cyan-600">AI-Powered Insights & Predictions</p>
          </div>
        </div>
        <p className="max-w-2xl text-gray-600">
          Leverage advanced artificial intelligence to predict future trends, identify
          opportunities, and receive intelligent recommendations. Stay ahead of the market with
          data-driven insights and predictive analytics.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Category:</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="predictive">Predictive</option>
            <option value="sales">Sales</option>
            <option value="inventory">Inventory</option>
            <option value="marketing">Marketing</option>
            <option value="operations">Operations</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Priority:</label>
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Insights
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-cyan-200 bg-cyan-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Brain className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">{summaryMetrics.totalInsights}</div>
            <p className="text-xs text-cyan-700">AI-generated recommendations</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{summaryMetrics.criticalAlerts}</div>
            <p className="text-xs text-red-700">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              ₱{(summaryMetrics.totalRevenuePotential / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-green-700">From current insights</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {summaryMetrics.avgConfidence}%
            </div>
            <p className="text-xs text-purple-700">AI prediction accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Strategy Overview */}
      <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-cyan-900">
                <Zap className="h-5 w-5" />
                AI-Driven Strategic Intelligence
              </CardTitle>
              <p className="mt-1 text-sm text-cyan-700">
                Predictive analytics and machine learning insights to optimize your business
                performance
              </p>
            </div>
            <Brain className="h-8 w-8 text-cyan-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-cyan-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-cyan-900">🔮 Predictive Analytics</h4>
              <ul className="space-y-1 text-sm text-cyan-800">
                <li>• Demand forecasting with 95% accuracy</li>
                <li>• Stock shortage prediction 3-7 days ahead</li>
                <li>• Customer churn risk identification</li>
                <li>• Seasonal trend analysis and planning</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-blue-900">🎯 Smart Recommendations</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Personalized product suggestions</li>
                <li>• Dynamic pricing optimization</li>
                <li>• Cross-selling opportunity detection</li>
                <li>• Inventory optimization strategies</li>
              </ul>
            </div>

            <div className="rounded-lg border border-green-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-green-900">📊 Real-time Monitoring</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Live performance anomaly detection</li>
                <li>• Automated alert system</li>
                <li>• KPI trend monitoring</li>
                <li>• Customer behavior pattern analysis</li>
              </ul>
            </div>

            <div className="rounded-lg border border-purple-200 bg-white p-4">
              <h4 className="mb-2 font-semibold text-purple-900">⚡ Automated Actions</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li>• Smart reorder point triggers</li>
                <li>• Dynamic promotional campaigns</li>
                <li>• Customer retention automation</li>
                <li>• Performance optimization workflows</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Current Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {filteredInsights.map(insight => (
              <Card key={insight.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1 flex-shrink-0">{getCategoryIcon(insight.category)}</div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center space-x-2">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{insight.confidence}% confidence</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(insight.title + '\n' + insight.description)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 font-medium">
                        <Target className="h-4 w-4" />
                        Impact & Timeline
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Expected Impact:</strong> {insight.impact}
                        </p>
                        <p>
                          <strong>Timeline:</strong> {insight.timeline}
                        </p>
                        {insight.metrics && (
                          <div className="mt-2 flex gap-4">
                            {insight.metrics.potential_revenue && (
                              <span className="font-medium text-green-600">
                                +₱{insight.metrics.potential_revenue.toLocaleString()}
                              </span>
                            )}
                            {insight.metrics.roi_percentage && (
                              <span className="font-medium text-blue-600">
                                {insight.metrics.roi_percentage}% ROI
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 flex items-center gap-2 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Recommended Actions
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {insight.actionItems.map((action, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="mt-1 text-gray-400">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Predictive Forecasts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Advanced machine learning models provide predictions for:
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">📈 Demand Forecasting</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• 7-day product demand prediction</li>
                      <li>• Seasonal trend analysis</li>
                      <li>• Regional demand variations</li>
                      <li>• Holiday and event impact modeling</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-900">📦 Inventory Optimization</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• Stock level optimization</li>
                      <li>• Reorder point calculations</li>
                      <li>• Excess inventory identification</li>
                      <li>• Supplier lead time modeling</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-purple-50 p-4">
                    <h4 className="mb-2 font-medium text-purple-900">👥 Customer Behavior</h4>
                    <ul className="space-y-1 text-sm text-purple-800">
                      <li>• Churn risk assessment</li>
                      <li>• Purchase pattern prediction</li>
                      <li>• Customer lifetime value</li>
                      <li>• Loyalty program effectiveness</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Strategic Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Revenue Optimization</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Implement dynamic pricing for high-demand periods</li>
                    <li>• Create product bundles based on purchase correlations</li>
                    <li>• Target high-value customer segments with premium offerings</li>
                    <li>• Optimize promotional timing and duration</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Operational Efficiency</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Automate reordering for fast-moving items</li>
                    <li>• Optimize staff scheduling based on traffic patterns</li>
                    <li>• Implement predictive maintenance for equipment</li>
                    <li>• Streamline supply chain with demand forecasting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Automated Intelligence</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  AI-powered automation capabilities currently available:
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-green-50 p-4">
                    <h4 className="mb-2 font-medium text-green-900">✅ Active Automations</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• Real-time anomaly detection</li>
                      <li>• Automated low-stock alerts</li>
                      <li>• Dynamic recommendation engine</li>
                      <li>• Customer segmentation updates</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4">
                    <h4 className="mb-2 font-medium text-blue-900">🔄 Planned Automations</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Smart reorder point triggers</li>
                      <li>• Automated promotional campaigns</li>
                      <li>• Customer retention workflows</li>
                      <li>• Predictive maintenance alerts</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-purple-50 p-4">
                    <h4 className="mb-2 font-medium text-purple-900">🚀 Future Capabilities</h4>
                    <ul className="space-y-1 text-sm text-purple-800">
                      <li>• Voice-activated inventory management</li>
                      <li>• Computer vision for quality control</li>
                      <li>• Natural language query interface</li>
                      <li>• Autonomous supply chain optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
