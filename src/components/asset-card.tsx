'use client';

import { useState, useCallback, memo } from 'react';
import { deleteAsset } from '@/app/actions';
import { AssetDetailDialog } from '@/components/asset-detail-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrendingUp, TrendingDown, MoreVertical, Eye, Trash2 } from 'lucide-react';
import type { Asset } from '@/db/schema';

interface AssetCardProps {
  asset: Asset & {
    profitData?: {
      unrealizedGain: number;
      gainPercentage: number;
    };
  };
}

function AssetCardComponent({ asset }: AssetCardProps) {
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteAsset(asset.id);
    if (result.error) {
      alert(result.error);
    }
  }, [asset.id, asset.name]);

  const handleShowDetails = useCallback(() => {
    setShowDetailDialog(true);
  }, []);

  const showProfit = asset.type === 'investment' && asset.symbol && asset.profitData;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="font-medium">{asset.name}</div>
        <div className="text-sm text-muted-foreground">
          {asset.symbol && `${asset.symbol}`}
        </div>
        {asset.description && (
          <div className="text-sm text-muted-foreground mt-1">
            {asset.description}
          </div>
        )}
        {asset.quantity && (
          <div className="text-sm text-muted-foreground mt-1">
            {parseFloat(asset.quantity).toFixed(4)} shares
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-semibold">
            {asset.currency} {parseFloat(asset.value).toFixed(2)}
          </div>
          {/* Show profit data when available */}
          {showProfit && asset.profitData && (
            <div
              className={`text-sm font-medium flex items-center justify-end gap-1 ${
                asset.profitData.unrealizedGain >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'
              }`}
            >
              {asset.profitData.unrealizedGain >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {asset.profitData.unrealizedGain >= 0 ? '+' : ''}
              {asset.currency} {Math.abs(asset.profitData.unrealizedGain).toFixed(2)}
              <span className="text-xs">({asset.profitData.gainPercentage.toFixed(2)}%)</span>
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
            {asset.type === 'investment' && asset.symbol && (
              <>
                <DropdownMenuItem onClick={handleShowDetails}>
                  <Eye className="h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {asset.type === 'investment' && asset.symbol && (
          <AssetDetailDialog
            assetId={asset.id}
            assetName={asset.name}
            assetSymbol={asset.symbol}
            currency={asset.currency}
            open={showDetailDialog}
            onOpenChange={setShowDetailDialog}
          />
        )}
      </div>
    </div>
  );
}

export const AssetCard = memo(AssetCardComponent);
