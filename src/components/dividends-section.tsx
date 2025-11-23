'use client';

import { useState } from 'react';
import { fetchAndStoreDividends, type DividendWithPayout } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, TrendingUp } from 'lucide-react';

interface DividendsSectionProps {
  assetId: number;
  assetSymbol?: string | null;
  currency: string;
  dividends: DividendWithPayout[];
  metrics: {
    totalDividends: number;
    ytdDividends: number;
    dividendYield: number;
    count: number;
  };
  onDividendsRefreshed: () => void;
}

export function DividendsSection({ 
  assetId, 
  assetSymbol, 
  currency, 
  dividends, 
  metrics,
  onDividendsRefreshed 
}: DividendsSectionProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  async function handleFetchDividends() {
    if (!assetSymbol) return;

    setIsFetching(true);
    setFetchMessage(null);

    const result = await fetchAndStoreDividends(assetId);
    
    if (result.success) {
      setFetchMessage(result.message || 'Dividends updated successfully');
      onDividendsRefreshed();
    } else if (result.error) {
      setFetchMessage(`Error: ${result.error}`);
    }

    setIsFetching(false);

    // Clear message after 5 seconds
    setTimeout(() => setFetchMessage(null), 5000);
  }

  return (
    <div className="space-y-4">
      {/* Header and Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Dividend History</h3>
          {metrics.count > 0 && (
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>Total: {currency} {metrics.totalDividends.toFixed(2)}</span>
              <span>YTD: {currency} {metrics.ytdDividends.toFixed(2)}</span>
              {metrics.dividendYield > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
                  <TrendingUp className="h-3 w-3" />
                  {metrics.dividendYield.toFixed(2)}% yield
                </span>
              )}
            </div>
          )}
        </div>
        {assetSymbol && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleFetchDividends}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Dividends
              </>
            )}
          </Button>
        )}
      </div>

      {/* Fetch Message */}
      {fetchMessage && (
        <div className={`text-sm rounded-lg border p-3 ${
          fetchMessage.startsWith('Error') 
            ? 'bg-destructive/10 text-destructive border-destructive/30' 
            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        }`}>
          {fetchMessage}
        </div>
      )}

      {/* Dividends Table */}
      {dividends.length === 0 ? (
        <div className="text-center py-8 rounded-lg border">
          <p className="text-sm text-muted-foreground mb-2">
            No dividend records found
          </p>
          {assetSymbol && (
            <p className="text-xs text-muted-foreground">
              Click "Sync Dividends" to fetch dividend history from the API
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Ex-Date</th>
                  <th className="text-left p-3 text-sm font-medium">Payment Date</th>
                  <th className="text-right p-3 text-sm font-medium">Per Share</th>
                  <th className="text-right p-3 text-sm font-medium">Shares Held</th>
                  <th className="text-right p-3 text-sm font-medium">Total Payout</th>
                  <th className="text-left p-3 text-sm font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dividends.map((dividend) => (
                  <tr key={dividend.id} className="hover:bg-muted/30">
                    <td className="p-3 text-sm">
                      {new Date(dividend.exDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-3 text-sm">
                      {dividend.paymentDate
                        ? new Date(dividend.paymentDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="p-3 text-sm text-right">
                      {currency} {parseFloat(dividend.amount).toFixed(4)}
                    </td>
                    <td className="p-3 text-sm text-right">
                      {dividend.sharesHeld.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-right font-medium text-emerald-600 dark:text-emerald-500">
                      {currency} {dividend.totalPayout.toFixed(2)}
                    </td>
                    <td className="p-3 text-sm">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        {dividend.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

