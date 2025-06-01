import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Coffee,
  Cigarette,
  Baby,
  Pill,
  Home,
  Zap,
  Pizza,
  Users,
  ShoppingCart,
} from 'lucide-react';

// Clean, professional styling - no background colors
const getCategoryStyle = (): string => {
  // All categories use the same clean styling
  return 'border-gray-200';
};

const categoryIcons: Record<string, any> = {
  tobacco: Cigarette,
  beverages: Coffee,
  'personal care': Baby,
  snacks: Package,
  dairy: Baby,
  household: Home,
  energy: Zap,
  food: Pizza,
  health: Pill,
  beauty: Users,
};

export function ProductCategories() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      // Get categories with product counts
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, category')
        .not('category', 'is', null);

      if (brandsError) throw brandsError;

      // Get product counts for each brand
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('brand_id');

      if (productsError) throw productsError;

      // Calculate counts by category
      const categoryCounts = brandsData.reduce(
        (acc, brand) => {
          const productCount = productsData.filter(p => p.brand_id === brand.id).length;

          if (!acc[brand.category]) {
            acc[brand.category] = 0;
          }
          acc[brand.category] += productCount;

          return acc;
        },
        {} as Record<string, number>
      );

      // Convert to array and sort by count
      return Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Product Categories</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {categories?.map(({ category, count }) => {
          const Icon = categoryIcons[category.toLowerCase()] || Package;

          return (
            <Card
              key={category}
              className="cursor-pointer border-gray-200 p-3 transition-shadow hover:shadow-md sm:p-4"
            >
              <div className="flex flex-col items-center text-center">
                <Icon className="mb-1 h-6 w-6 text-gray-600 sm:mb-2 sm:h-8 sm:w-8" />
                <h3 className="text-xs font-medium capitalize text-gray-700 sm:text-sm">
                  {category}
                </h3>
                <p className="text-lg font-bold text-gray-900 sm:text-2xl">{count}</p>
                <p className="text-xs text-gray-500">products</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
