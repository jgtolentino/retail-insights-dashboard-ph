import { Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ExportButton({
  onExport,
  disabled = false,
  loading = false,
  label = 'Export',
  variant = 'outline',
  size = 'sm',
  className,
}: ExportButtonProps) {
  const { hasPermission } = useUser();
  const canExport = hasPermission('canExport');

  if (!canExport) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={variant} size={size} disabled className={className}>
              <Lock className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>You don't have permission to export data</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onExport}
      disabled={disabled || loading}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {loading ? 'Exporting...' : label}
    </Button>
  );
}
