'use client';

import { useState, useCallback, memo } from 'react';
import { deleteLiability } from '@/app/actions';
import { LiabilityDetailDialog } from '@/components/liability-detail-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Trash2, Percent } from 'lucide-react';
import type { Liability } from '@/db/schema';

interface LiabilityCardProps {
  liability: Liability;
}

function LiabilityCardComponent({ liability }: LiabilityCardProps) {
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete "${liability.name}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteLiability(liability.id);
    if (result.error) {
      alert(result.error);
    }
  }, [liability.id, liability.name]);

  const handleShowDetails = useCallback(() => {
    setShowDetailDialog(true);
  }, []);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="font-medium">{liability.name}</div>
        <div className="text-sm text-muted-foreground capitalize">
          {liability.type.replace(/_/g, ' ')}
        </div>
        {liability.description && (
          <div className="text-sm text-muted-foreground mt-1">
            {liability.description}
          </div>
        )}
        {liability.interestRate && (
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Percent className="h-3 w-3" />
            {parseFloat(liability.interestRate).toFixed(2)}% APR
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-semibold text-rose-600 dark:text-rose-500">
            {liability.currency} {parseFloat(liability.balance).toFixed(2)}
          </div>
          {liability.lastPaymentDate && (
            <div className="text-xs text-muted-foreground mt-1">
              Last payment: {new Date(liability.lastPaymentDate).toLocaleDateString()}
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShowDetails}>
              <Eye className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LiabilityDetailDialog
          liabilityId={liability.id}
          liabilityName={liability.name}
          currency={liability.currency}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      </div>
    </div>
  );
}

export const LiabilityCard = memo(LiabilityCardComponent);
