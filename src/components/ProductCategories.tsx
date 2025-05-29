import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  ShoppingCart
} from "lucide-react";

// Clean, professional styling - no background colors
const getCategoryStyle = (): string => {
  // All categories use the same clean styling
  return 'border-gray-200';
};

const categoryIcons: Record<string, any> = {
  'tobacco': Cigarette,
  'beverages': Coffee,
  'personal care': Baby,
  'snacks': Package,
  'dairy': Baby,
  'household': Home,
  'energy': Zap,
  'food': Pizza,
  'health': Pill,
  'beauty': Users,
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
      const categoryCounts = brandsData.reduce((acc, brand) => {
        const productCount = productsData.filter(p => p.brand_id === brand.id).length;
        
        if (!acc[brand.category]) {
          acc[brand.category] = 0;
        }
        acc[brand.category] += productCount;
        
        return acc;
      }, {} as Record<string, number>);

      // Convert to array and sort by count
      return Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Product Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {categories?.map(({ category, count }) => {
          const Icon = categoryIcons[category.toLowerCase()] || Package;
          
          return (
            <Card 
              key={category}
              className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200"
            >
              <div className="flex flex-col items-center text-center">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-gray-600" />
                <h3 className="font-medium text-xs sm:text-sm capitalize text-gray-700">{category}</h3>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">products</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
