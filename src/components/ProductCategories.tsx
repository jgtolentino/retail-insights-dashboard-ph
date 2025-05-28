import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Coffee, Cigarette, Home, Pizza, Users, ShoppingCart } from "lucide-react";

const categoryIcons: Record<string, any> = {
  'tobacco': Cigarette,
  'beverages': Coffee,
  'dairy': Package,
  'household': Home,
  'food': Pizza,
  'personal care': Users,
  'snacks': ShoppingCart,
};

const categoryColors: Record<string, string> = {
  'tobacco': 'bg-orange-100 text-orange-800 border-orange-200',
  'beverages': 'bg-blue-100 text-blue-800 border-blue-200',
  'dairy': 'bg-green-100 text-green-800 border-green-200',
  'household': 'bg-purple-100 text-purple-800 border-purple-200',
  'food': 'bg-red-100 text-red-800 border-red-200',
  'personal care': 'bg-pink-100 text-pink-800 border-pink-200',
  'snacks': 'bg-yellow-100 text-yellow-800 border-yellow-200',
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
      <h2 className="text-lg font-semibold mb-4">Product Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {categories?.map(({ category, count }) => {
          const Icon = categoryIcons[category.toLowerCase()] || Package;
          const colorClass = categoryColors[category.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
          
          return (
            <Card 
              key={category}
              className={`p-4 hover:shadow-md transition-shadow cursor-pointer border ${colorClass}`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className="h-8 w-8 mb-2" />
                <h3 className="font-medium text-sm capitalize">{category}</h3>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}