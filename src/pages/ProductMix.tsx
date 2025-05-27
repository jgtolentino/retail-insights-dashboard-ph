import { ProductMixDashboard } from '@/components/ProductMixDashboard';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductMix() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <ProductMixDashboard />
      </div>
    </div>
  );
}