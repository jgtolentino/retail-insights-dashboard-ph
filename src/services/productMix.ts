import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface ProductSubstitution {
  fromProduct: string;
  toProduct: string;
  fromCategory?: string;
  toCategory?: string;
  count: number;
}

export interface ParetoItem {
  name: string;
  value: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface ProductMixFilters {
  startDate: Date;
  endDate: Date;
  category?: string;
  brandId?: string;
  storeLocation?: string;
}

export const productMixService = {
  // Get product substitution data for Sankey diagram
  async getProductSubstitutions(filters: ProductMixFilters): Promise<{
    nodes: any[];
    links: any[];
  }> {
    logger.info('Fetching product substitutions', filters);
    
    try {
      // For now, we'll simulate substitution data
      // In a real implementation, this would track when customers buy Product B instead of Product A
      const { data: transactions, error } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          products!inner(
            id,
            name,
            category,
            brand_id
          ),
          transactions!inner(
            created_at,
            store_location
          )
        `)
        .gte('transactions.created_at', filters.startDate.toISOString())
        .lte('transactions.created_at', filters.endDate.toISOString());

      if (error) throw error;

      // Group products by category for substitution analysis
      const productsByCategory = new Map<string, Set<string>>();
      const productDetails = new Map<string, { name: string; category: string }>();

      transactions?.forEach(item => {
        const category = item.products.category || 'Other';
        const productName = item.products.name;
        
        if (!productsByCategory.has(category)) {
          productsByCategory.set(category, new Set());
        }
        productsByCategory.get(category)!.add(productName);
        productDetails.set(productName, { name: productName, category });
      });

      // Create nodes for Sankey
      const nodes: any[] = [];
      const nodeMap = new Map<string, number>();
      let nodeId = 0;

      productDetails.forEach((details, productName) => {
        nodes.push({
          id: productName,
          name: productName,
          category: details.category
        });
        nodeMap.set(productName, nodeId++);
      });

      // Simulate substitution links (in real app, this would be based on actual substitution data)
      const links: any[] = [];
      const categories = Array.from(productsByCategory.keys());
      
      categories.forEach(category => {
        const products = Array.from(productsByCategory.get(category) || []);
        
        // Create some sample substitution patterns within category
        for (let i = 0; i < products.length - 1; i++) {
          for (let j = i + 1; j < Math.min(i + 3, products.length); j++) {
            const value = Math.floor(Math.random() * 20) + 5;
            links.push({
              source: products[i],
              target: products[j],
              value
            });
          }
        }
      });

      return { nodes, links };
    } catch (error) {
      logger.error('Failed to fetch product substitutions', error);
      return { nodes: [], links: [] };
    }
  },

  // Get Pareto data for products/categories
  async getParetoAnalysis(
    filters: ProductMixFilters,
    groupBy: 'product' | 'category' | 'brand' = 'product'
  ): Promise<ParetoItem[]> {
    logger.info('Fetching Pareto analysis', { filters, groupBy });
    
    try {
      const { data: items, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          price,
          products!inner(
            name,
            category,
            brands!inner(
              id,
              name
            )
          ),
          transactions!inner(
            created_at,
            store_location
          )
        `)
        .gte('transactions.created_at', filters.startDate.toISOString())
        .lte('transactions.created_at', filters.endDate.toISOString());

      if (error) throw error;

      // Group and calculate revenue
      const revenueMap = new Map<string, number>();
      
      items?.forEach(item => {
        let key: string;
        
        switch (groupBy) {
          case 'category':
            key = item.products.category || 'Other';
            break;
          case 'brand':
            key = item.products.brands.name;
            break;
          default:
            key = item.products.name;
        }
        
        const revenue = (item.quantity || 0) * (item.price || 0);
        revenueMap.set(key, (revenueMap.get(key) || 0) + revenue);
      });

      // Sort by revenue descending
      const sortedItems = Array.from(revenueMap.entries())
        .sort((a, b) => b[1] - a[1]);

      // Calculate total revenue
      const totalRevenue = sortedItems.reduce((sum, [_, value]) => sum + value, 0);

      // Build Pareto data
      let cumulativePercentage = 0;
      const paretoData: ParetoItem[] = sortedItems.map(([name, value]) => {
        const percentage = (value / totalRevenue) * 100;
        cumulativePercentage += percentage;
        
        return {
          name,
          value,
          percentage,
          cumulativePercentage
        };
      });

      return paretoData;
    } catch (error) {
      logger.error('Failed to fetch Pareto analysis', error);
      return [];
    }
  },

  // Get category breakdown
  async getCategoryBreakdown(filters: ProductMixFilters) {
    logger.info('Fetching category breakdown', filters);
    
    try {
      const { data: items, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          price,
          products!inner(
            category
          ),
          transactions!inner(
            created_at,
            store_location
          )
        `)
        .gte('transactions.created_at', filters.startDate.toISOString())
        .lte('transactions.created_at', filters.endDate.toISOString());

      if (error) throw error;

      // Group by category
      const categoryMap = new Map<string, { units: number; revenue: number }>();
      
      items?.forEach(item => {
        const category = item.products.category || 'Other';
        const existing = categoryMap.get(category) || { units: 0, revenue: 0 };
        
        existing.units += item.quantity || 0;
        existing.revenue += (item.quantity || 0) * (item.price || 0);
        
        categoryMap.set(category, existing);
      });

      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        ...data
      }));
    } catch (error) {
      logger.error('Failed to fetch category breakdown', error);
      return [];
    }
  }
};