
import { supabase } from '@/integrations/supabase/client';

export interface ProductMixFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  location: string[];
  brandId: string[];
  productId: string[];
  ageGroup: string[];
  gender: string[];
}

export interface ProductSalesData {
  product_name: string;
  brand_name: string;
  total_sales: number;
  total_quantity: number;
  percentage_of_total: number;
}

export interface BrandPerformanceData {
  brand_name: string;
  total_sales: number;
  product_count: number;
  avg_price: number;
  market_share: number;
}

export interface SubstitutionData {
  original_product: string;
  substitute_product: string;
  frequency: number;
  reason: string;
}

export const productMixService = {
  async getProductSalesData(filters: ProductMixFilters): Promise<ProductSalesData[]> {
    try {
      let query = supabase
        .from('transaction_items')
        .select(`
          price,
          quantity,
          products (
            name,
            brands (
              name
            )
          ),
          transactions (
            created_at,
            store_location,
            customer_age,
            customer_gender
          )
        `)
        .gte('transactions.created_at', filters.dateRange.from.toISOString())
        .lte('transactions.created_at', filters.dateRange.to.toISOString());

      // Apply filters
      if (filters.location.length > 0) {
        query = query.in('transactions.store_location', filters.location);
      }

      if (filters.brandId.length > 0) {
        query = query.in('products.brands.name', filters.brandId);
      }

      if (filters.productId.length > 0) {
        query = query.in('products.name', filters.productId);
      }

      if (filters.gender.length > 0) {
        query = query.in('transactions.customer_gender', filters.gender);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate data by product
      const productSales: Record<string, {
        brand_name: string;
        total_sales: number;
        total_quantity: number;
      }> = {};

      data?.forEach(item => {
        const productName = item.products?.name;
        const brandName = item.products?.brands?.name;
        const sales = (item.price || 0) * (item.quantity || 0);
        const quantity = item.quantity || 0;

        if (productName && brandName) {
          const key = productName;
          if (!productSales[key]) {
            productSales[key] = {
              brand_name: brandName,
              total_sales: 0,
              total_quantity: 0
            };
          }
          productSales[key].total_sales += sales;
          productSales[key].total_quantity += quantity;
        }
      });

      const totalSales = Object.values(productSales).reduce((sum, item) => sum + item.total_sales, 0);

      return Object.entries(productSales).map(([productName, data]) => ({
        product_name: productName,
        brand_name: data.brand_name,
        total_sales: data.total_sales,
        total_quantity: data.total_quantity,
        percentage_of_total: totalSales > 0 ? (data.total_sales / totalSales) * 100 : 0
      }));

    } catch (error) {
      console.error('Error fetching product sales data:', error);
      return [];
    }
  },

  async getBrandPerformanceData(filters: ProductMixFilters): Promise<BrandPerformanceData[]> {
    try {
      let query = supabase
        .from('transaction_items')
        .select(`
          price,
          quantity,
          products (
            name,
            brands (
              name
            )
          ),
          transactions (
            created_at,
            store_location,
            customer_age,
            customer_gender
          )
        `)
        .gte('transactions.created_at', filters.dateRange.from.toISOString())
        .lte('transactions.created_at', filters.dateRange.to.toISOString());

      // Apply filters
      if (filters.location.length > 0) {
        query = query.in('transactions.store_location', filters.location);
      }

      if (filters.brandId.length > 0) {
        query = query.in('products.brands.name', filters.brandId);
      }

      if (filters.productId.length > 0) {
        query = query.in('products.name', filters.productId);
      }

      if (filters.gender.length > 0) {
        query = query.in('transactions.customer_gender', filters.gender);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate data by brand
      const brandPerformance: Record<string, {
        total_sales: number;
        products: Set<string>;
        prices: number[];
      }> = {};

      data?.forEach(item => {
        const brandName = item.products?.brands?.name;
        const productName = item.products?.name;
        const sales = (item.price || 0) * (item.quantity || 0);
        const price = item.price || 0;

        if (brandName && productName) {
          if (!brandPerformance[brandName]) {
            brandPerformance[brandName] = {
              total_sales: 0,
              products: new Set(),
              prices: []
            };
          }
          brandPerformance[brandName].total_sales += sales;
          brandPerformance[brandName].products.add(productName);
          brandPerformance[brandName].prices.push(price);
        }
      });

      const totalMarketSales = Object.values(brandPerformance).reduce((sum, brand) => sum + brand.total_sales, 0);

      return Object.entries(brandPerformance).map(([brandName, data]) => ({
        brand_name: brandName,
        total_sales: data.total_sales,
        product_count: data.products.size,
        avg_price: data.prices.length > 0 ? data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length : 0,
        market_share: totalMarketSales > 0 ? (data.total_sales / totalMarketSales) * 100 : 0
      }));

    } catch (error) {
      console.error('Error fetching brand performance data:', error);
      return [];
    }
  },

  async getSubstitutionData(filters: ProductMixFilters): Promise<SubstitutionData[]> {
    try {
      let query = supabase
        .from('substitutions')
        .select(`
          reason,
          original_product:products!substitutions_original_product_id_fkey (name),
          substitute_product:products!substitutions_substitute_product_id_fkey (name),
          transactions (
            created_at,
            store_location,
            customer_age,
            customer_gender
          )
        `)
        .gte('transactions.created_at', filters.dateRange.from.toISOString())
        .lte('transactions.created_at', filters.dateRange.to.toISOString());

      // Apply filters
      if (filters.location.length > 0) {
        query = query.in('transactions.store_location', filters.location);
      }

      if (filters.brandId.length > 0) {
        // This would need a more complex join to filter by brand
      }

      if (filters.productId.length > 0) {
        // This would need a more complex join to filter by product
      }

      if (filters.gender.length > 0) {
        query = query.in('transactions.customer_gender', filters.gender);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate substitution data
      const substitutions: Record<string, {
        frequency: number;
        reasons: string[];
      }> = {};

      data?.forEach(item => {
        const originalProduct = item.original_product?.name;
        const substituteProduct = item.substitute_product?.name;
        const reason = item.reason || 'Unknown';

        if (originalProduct && substituteProduct) {
          const key = `${originalProduct}->${substituteProduct}`;
          if (!substitutions[key]) {
            substitutions[key] = {
              frequency: 0,
              reasons: []
            };
          }
          substitutions[key].frequency += 1;
          if (reason && !substitutions[key].reasons.includes(reason)) {
            substitutions[key].reasons.push(reason);
          }
        }
      });

      return Object.entries(substitutions).map(([key, data]) => {
        const [originalProduct, substituteProduct] = key.split('->');
        return {
          original_product: originalProduct,
          substitute_product: substituteProduct,
          frequency: data.frequency,
          reason: data.reasons.join(', ')
        };
      });

    } catch (error) {
      console.error('Error fetching substitution data:', error);
      return [];
    }
  }
};
