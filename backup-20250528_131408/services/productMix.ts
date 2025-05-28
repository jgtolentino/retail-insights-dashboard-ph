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
  // Get product substitution data
  async getProductSubstitutions(filters: ProductMixFilters): Promise<any[]> {
    logger.info('Fetching product substitutions', filters);
    
    try {
      // For now, we'll simulate substitution data
      // In a real implementation, this would track when customers buy Product B instead of Product A
      let query = supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          products!inner(
            id,
            name,
            brand_id,
            brands!inner(
              id,
              name,
              category
            )
          ),
          transactions!inner(
            created_at,
            store_location
          )
        `)
        .gte('transactions.created_at', filters.startDate.toISOString())
        .lte('transactions.created_at', filters.endDate.toISOString());

      // Apply category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('products.brands.category', filters.category);
      }

      // Apply brand filter
      if (filters.brand && filters.brand !== 'all') {
        query = query.eq('products.brand_id', filters.brand);
      }

      // Apply product filter
      if (filters.product && filters.product !== 'all') {
        query = query.eq('products.name', filters.product);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      // Create a map of products by category
      const productsByCategory = new Map<string, string[]>();
      const productMap = new Map<string, { name: string; category: string; brandName: string }>();

      transactions?.forEach(item => {
        const category = item.products.brands?.category || 'Other';
        const productName = item.products.name;
        const brandName = item.products.brands?.name || 'Unknown';
        
        if (!productsByCategory.has(category)) {
          productsByCategory.set(category, []);
        }
        if (!productsByCategory.get(category)!.includes(productName)) {
          productsByCategory.get(category)!.push(productName);
        }
        
        productMap.set(productName, { name: productName, category, brandName });
      });

      // Generate realistic substitution patterns
      const substitutions: any[] = [];
      const reasons = ['Out of stock', 'Price preference', 'Brand loyalty', 'Customer request', 'Promotion'];
      
      // For each category, create substitution patterns
      productsByCategory.forEach((products, category) => {
        if (products.length < 2) return;
        
        // Create substitutions within the same category
        for (let i = 0; i < Math.min(products.length - 1, 5); i++) {
          for (let j = i + 1; j < Math.min(products.length, i + 3); j++) {
            const count = Math.floor(Math.random() * 50) + 10;
            const reasonIndex = Math.floor(Math.random() * reasons.length);
            
            substitutions.push({
              original_product: products[i],
              substitute_product: products[j],
              count: count,
              reasons: reasons[reasonIndex],
              revenue_impact: count * (Math.random() * 50 + 20)
            });
          }
        }
      });

      // Sort by count descending
      substitutions.sort((a, b) => b.count - a.count);

      return substitutions.slice(0, 20); // Return top 20 substitutions
    } catch (error) {
      logger.error('Failed to fetch product substitutions', error);
      return [];
    }
  },

  // Get Pareto data for products/categories
  async getParetoAnalysis(
    filters: ProductMixFilters,
    groupBy: 'product' | 'category' | 'brand' = 'product'
  ): Promise<ParetoItem[]> {
    logger.info('Fetching Pareto analysis', { filters, groupBy });
    
    try {
      let query = supabase
        .from('transaction_items')
        .select(`
          quantity,
          price,
          products!inner(
            name,
            brand_id,
            brands!inner(
              id,
              name,
              category
            )
          ),
          transactions!inner(
            created_at,
            store_location
          )
        `)
        .gte('transactions.created_at', filters.startDate.toISOString())
        .lte('transactions.created_at', filters.endDate.toISOString());

      // Apply category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('products.brands.category', filters.category);
      }

      // Apply brand filter
      if (filters.brand && filters.brand !== 'all') {
        query = query.eq('products.brand_id', filters.brand);
      }

      // Apply product filter
      if (filters.product && filters.product !== 'all') {
        query = query.eq('products.name', filters.product);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      // Group and calculate revenue
      const revenueMap = new Map<string, number>();
      
      items?.forEach(item => {
        let key: string;
        
        switch (groupBy) {
          case 'category':
            key = item.products.brands?.category || 'Other';
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
      let query = supabase
        .from('transaction_items')
        .select(`
          quantity,
          price,
          products!inner(
            brand_id,
            brands!inner(
              id,
              category
            )
          ),
          transactions!inner(
            created_at,
            store_location
          )
        `)
        .gte('transactions.created_at', filters.startDate.toISOString())
        .lte('transactions.created_at', filters.endDate.toISOString());

      // Apply category filter
      if (filters.category && filters.category !== 'all') {
        query = query.eq('products.brands.category', filters.category);
      }

      // Apply brand filter
      if (filters.brand && filters.brand !== 'all') {
        query = query.eq('products.brand_id', filters.brand);
      }

      // Apply product filter
      if (filters.product && filters.product !== 'all') {
        query = query.eq('products.name', filters.product);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      // Group by category
      const categoryMap = new Map<string, { units: number; revenue: number }>();
      
      items?.forEach(item => {
        const category = item.products.brands?.category || 'Other';
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