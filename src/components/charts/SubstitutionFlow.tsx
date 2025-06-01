/**
 * SubstitutionFlow Component - Sankey Diagram for Product Substitution Patterns
 * Visualizes how customers substitute products when originals are unavailable
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enhancedAnalyticsService, SubstitutionPattern, DateRange } from '@/services/enhanced-analytics';

// Simplified Sankey-style visualization without D3 dependency
interface SankeyNode {
  id: string;
  name: string;
  value: number;
  type: 'original' | 'substitute';
  color: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  acceptanceRate: number;
  color: string;
}

interface SubstitutionFlowProps {
  dateRange?: DateRange;
  className?: string;
}

export function SubstitutionFlow({ dateRange, className }: SubstitutionFlowProps) {
  const [data, setData] = useState<SubstitutionPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sankeyData, setSankeyData] = useState<{ nodes: SankeyNode[]; links: SankeyLink[] }>({ nodes: [], links: [] });

  // Load substitution data
  useEffect(() => {
    const loadSubstitutionData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const patterns = await enhancedAnalyticsService.getSubstitutionPatterns(dateRange);
        setData(patterns);
        
        // Transform data for Sankey visualization
        const sankeyTransformed = transformToSankeyData(patterns, selectedCategory);
        setSankeyData(sankeyTransformed);
        
      } catch (err) {
        console.error('Error loading substitution data:', err);
        setError('Failed to load substitution patterns');
      } finally {
        setLoading(false);
      }
    };

    loadSubstitutionData();
  }, [dateRange, selectedCategory]);

  // Transform substitution patterns to Sankey format
  const transformToSankeyData = (patterns: SubstitutionPattern[], category: string) => {
    let filteredPatterns = patterns;
    
    if (category !== 'all') {
      // In a real implementation, you'd filter by product category
      // For now, we'll use brand filtering as a proxy
      filteredPatterns = patterns.filter(p => 
        p.original_brand.toLowerCase().includes(category.toLowerCase()) ||
        p.substitute_brand.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Limit to top 20 patterns for clarity
    const topPatterns = filteredPatterns.slice(0, 20);
    
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];
    const nodeMap = new Map<string, number>();

    // Create nodes for original and substitute brands
    topPatterns.forEach(pattern => {
      const originalId = `original_${pattern.original_brand}`;
      const substituteId = `substitute_${pattern.substitute_brand}`;

      if (!nodeMap.has(originalId)) {
        nodes.push({
          id: originalId,
          name: pattern.original_brand,
          value: pattern.substitution_count,
          type: 'original',
          color: '#ef4444' // Red for originals (being replaced)
        });
        nodeMap.set(originalId, nodes.length - 1);
      }

      if (!nodeMap.has(substituteId)) {
        nodes.push({
          id: substituteId,
          name: pattern.substitute_brand,
          value: pattern.substitution_count,
          type: 'substitute',
          color: '#10b981' // Green for substitutes (gaining sales)
        });
        nodeMap.set(substituteId, nodes.length - 1);
      }

      // Create link
      links.push({
        source: originalId,
        target: substituteId,
        value: pattern.substitution_count,
        acceptanceRate: pattern.acceptance_rate,
        color: getAcceptanceRateColor(pattern.acceptance_rate)
      });
    });

    return { nodes, links };
  };

  // Get color based on acceptance rate
  const getAcceptanceRateColor = (acceptanceRate: number): string => {
    if (acceptanceRate >= 0.8) return '#10b981'; // High acceptance - green
    if (acceptanceRate >= 0.6) return '#f59e0b'; // Medium acceptance - yellow
    return '#ef4444'; // Low acceptance - red
  };

  // Get unique categories from data
  const getCategories = () => {
    const categories = new Set<string>();
    data.forEach(pattern => {
      // Extract category from brand name (simplified)
      categories.add(pattern.original_brand.split(' ')[0]);
      categories.add(pattern.substitute_brand.split(' ')[0]);
    });
    return Array.from(categories).slice(0, 10); // Limit for UI
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Product Substitution Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading substitution patterns...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Product Substitution Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Product Substitution Flow
          </CardTitle>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {getCategories().map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No substitution patterns found for this period</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Simplified Flow Visualization */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-8 min-h-96">
                {/* Original Brands Column */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-4">
                    Original Products (Being Replaced)
                  </h3>
                  {sankeyData.nodes
                    .filter(node => node.type === 'original')
                    .slice(0, 10)
                    .map((node, index) => (
                      <div 
                        key={node.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-red-50"
                        style={{ 
                          height: `${Math.max(40, node.value * 3)}px`,
                          marginBottom: '8px'
                        }}
                      >
                        <span className="font-medium text-sm">{node.name}</span>
                        <Badge variant="destructive" className="text-xs">
                          {node.value} subs
                        </Badge>
                      </div>
                    ))}
                </div>

                {/* Substitute Brands Column */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-4">
                    Substitute Products (Gaining Sales)
                  </h3>
                  {sankeyData.nodes
                    .filter(node => node.type === 'substitute')
                    .slice(0, 10)
                    .map((node, index) => (
                      <div 
                        key={node.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                        style={{ 
                          height: `${Math.max(40, node.value * 3)}px`,
                          marginBottom: '8px'
                        }}
                      >
                        <span className="font-medium text-sm">{node.name}</span>
                        <Badge variant="default" className="text-xs bg-green-600">
                          {node.value} gains
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              {/* Connection Lines (Visual Enhancement) */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" style={{ zIndex: 1 }}>
                  {sankeyData.links.slice(0, 8).map((link, index) => {
                    const y1 = 60 + (index * 60);
                    const y2 = 60 + (index * 60);
                    return (
                      <path
                        key={`${link.source}-${link.target}`}
                        d={`M 48% ${y1} Q 50% ${(y1 + y2) / 2} 52% ${y2}`}
                        stroke={link.color}
                        strokeWidth={Math.max(1, link.value / 2)}
                        fill="none"
                        opacity={0.3}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Key Insights */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Key Substitution Insights</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {data.slice(0, 4).map((pattern, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{pattern.original_brand}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">{pattern.substitute_brand}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{pattern.substitution_count} substitutions</span>
                      <span>{(pattern.acceptance_rate * 100).toFixed(0)}% accepted</span>
                      {pattern.avg_price_diff !== 0 && (
                        <span className={pattern.avg_price_diff > 0 ? 'text-red-600' : 'text-green-600'}>
                          {pattern.avg_price_diff > 0 ? '+' : ''}₱{pattern.avg_price_diff.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-gray-600 pt-2 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Original Products</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Substitute Products</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded"></div>
                <span>Acceptance Rate (Low → High)</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubstitutionFlow;