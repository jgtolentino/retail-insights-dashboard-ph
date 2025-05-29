import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Target, Users, Package, Copy, Download, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'sales' | 'inventory' | 'marketing' | 'operations';
  confidence: number;
  impact: string;
  actionItems: string[];
  metrics?: {
    potential_revenue?: number;
    efficiency_gain?: number;
    cost_reduction?: number;
  };
}

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Optimize Marlboro Red Inventory in QC South',
    description: 'Marlboro Red shows 23% higher demand in QC South vs other regions, but current stock levels suggest potential shortages during peak hours (3-6 PM).',
    priority: 'high',
    category: 'inventory',
    confidence: 87,
    impact: 'Prevent 15% revenue loss during peak periods',
    actionItems: [
      'Increase Marlboro Red stock by 30% for QC South stores',
      'Implement dynamic pricing during peak hours',
      'Set up automated reorder alerts at 20% stock level'
    ],
    metrics: {
      potential_revenue: 125000,
      efficiency_gain: 18
    }
  },
  {
    id: '2',
    title: 'Bundle Max Energy + Yosi for Gen Z Customers',
    description: 'Data shows 65% of Gen Z customers who buy energy drinks also purchase cigarettes within the same transaction. Creating a bundle could increase basket size.',
    priority: 'high',
    category: 'marketing',
    confidence: 82,
    impact: 'Increase average basket size by 12%',
    actionItems: [
      'Create "Energy + Focus" bundle promotion',
      'Target 18-25 age demographic with digital promotion',
      'Track bundle performance vs individual sales'
    ],
    metrics: {
      potential_revenue: 89000,
      efficiency_gain: 12
    }
  },
  {
    id: '3',
    title: 'Address Weekend Sales Dip',
    description: 'Weekend sales are 18% lower than weekdays, particularly Saturday mornings. This suggests opportunity for targeted promotions.',
    priority: 'medium',
    category: 'sales',
    confidence: 75,
    impact: 'Boost weekend revenue by 8-12%',
    actionItems: [
      'Launch "Saturday Special" discount program',
      'Promote breakfast + coffee bundles for Saturday AM',
      'Analyze competitor weekend pricing strategies'
    ],
    metrics: {
      potential_revenue: 67000,
      cost_reduction: 5
    }
  },
  {
    id: '4',
    title: 'Implement Smart Substitution Alerts',
    description: 'When customers ask for unavailable products, staff suggest alternatives only 45% of the time. AI-powered substitution prompts could improve this.',
    priority: 'medium',
    category: 'operations',
    confidence: 73,
    impact: 'Reduce lost sales by 22%',
    actionItems: [
      'Deploy tablet-based substitution recommendation system',
      'Train staff on top 10 product substitutions',
      'Track substitution acceptance rates'
    ],
    metrics: {
      potential_revenue: 54000,
      efficiency_gain: 22
    }
  },
  {
    id: '5',
    title: 'Optimize Female Customer Experience',
    description: 'Female customers represent only 28% of transactions but have 15% higher average basket value. Targeted improvements could increase this segment.',
    priority: 'low',
    category: 'marketing',
    confidence: 68,
    impact: 'Grow female customer base by 20%',
    actionItems: [
      'Enhance product selection for female preferences',
      'Improve store ambiance and cleanliness',
      'Create female-targeted loyalty program'
    ],
    metrics: {
      potential_revenue: 43000,
      efficiency_gain: 8
    }
  }
];

export default function AIRecommendations() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredRecommendations = useMemo(() => {
    return mockRecommendations.filter(rec => {
      const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
      const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
      return categoryMatch && priorityMatch;
    });
  }, [selectedCategory, selectedPriority]);

  const summaryMetrics = useMemo(() => {
    const totalPotentialRevenue = mockRecommendations.reduce(
      (sum, rec) => sum + (rec.metrics?.potential_revenue || 0), 0
    );
    const avgConfidence = mockRecommendations.reduce(
      (sum, rec) => sum + rec.confidence, 0
    ) / mockRecommendations.length;
    
    return {
      totalRecommendations: mockRecommendations.length,
      highPriority: mockRecommendations.filter(r => r.priority === 'high').length,
      totalPotentialRevenue,
      avgConfidence: avgConfidence.toFixed(1)
    };
  }, []);

  const handleCopyRecommendation = (rec: Recommendation) => {
    const text = `
${rec.title}

${rec.description}

Action Items:
${rec.actionItems.map(item => `• ${item}`).join('\n')}

Priority: ${rec.priority.toUpperCase()}
Confidence: ${rec.confidence}%
Impact: ${rec.impact}
    `.trim();

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Recommendation details have been copied"
    });
  };

  const handleExportAll = () => {
    const allText = mockRecommendations.map(rec => `
${rec.title}
${rec.description}

Action Items:
${rec.actionItems.map(item => `• ${item}`).join('\n')}

Priority: ${rec.priority.toUpperCase()}
Confidence: ${rec.confidence}%
Impact: ${rec.impact}
---
    `).join('\n');

    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-recommendations.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales':
        return <TrendingUp className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      case 'marketing':
        return <Users className="h-4 w-4" />;
      case 'operations':
        return <Target className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            Data-driven insights and actionable recommendations to optimize your retail operations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryMetrics.totalRecommendations}</div>
              <Badge variant="secondary" className="mt-1">
                {summaryMetrics.highPriority} High Priority
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{summaryMetrics.totalPotentialRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                If all recommendations implemented
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryMetrics.avgConfidence}%</div>
              <p className="text-xs text-muted-foreground">
                AI confidence level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportAll} variant="outline" size="sm" className="w-full">
                Export All
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList>
                  <TabsTrigger value="all">All Categories</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="marketing">Marketing</TabsTrigger>
                  <TabsTrigger value="operations">Operations</TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs value={selectedPriority} onValueChange={setSelectedPriority}>
                <TabsList>
                  <TabsTrigger value="all">All Priorities</TabsTrigger>
                  <TabsTrigger value="high">High</TabsTrigger>
                  <TabsTrigger value="medium">Medium</TabsTrigger>
                  <TabsTrigger value="low">Low</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations List */}
        <div className="space-y-6">
          {filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getCategoryIcon(rec.category)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <p className="text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(rec.priority)}
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Action Items</h4>
                    <ul className="space-y-1">
                      {rec.actionItems.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium">Confidence</div>
                        <div className="text-lg font-bold text-blue-600">{rec.confidence}%</div>
                      </div>
                      {rec.metrics?.potential_revenue && (
                        <div>
                          <div className="text-sm font-medium">Potential Revenue</div>
                          <div className="text-lg font-bold text-green-600">
                            ₱{rec.metrics.potential_revenue.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-1">Expected Impact</div>
                      <div className="text-sm text-muted-foreground">{rec.impact}</div>
                    </div>

                    <Button 
                      onClick={() => handleCopyRecommendation(rec)}
                      variant="outline" 
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}