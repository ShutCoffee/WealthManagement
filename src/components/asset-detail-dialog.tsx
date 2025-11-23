'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getAssetTransactions, calculateAssetProfit, deleteTransaction, getDividendsWithPayouts, calculateDividendMetrics, type DividendWithPayout } from '@/app/actions';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { DividendsSection } from '@/components/dividends-section';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Transaction } from '@/db/schema';

interface AssetDetailDialogProps {
  assetId: number;
  assetName: string;
  assetSymbol?: string | null;
  currency: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ProfitData {
  totalShares: number;
  avgCostBasis: number;
  currentPrice: number;
  currentValue: number;
  totalCost: number;
  unrealizedGain: number;
  realizedGain: number;
  dividendIncome: number;
  totalGain: number;
  gainPercentage: number;
}

export function AssetDetailDialog({ 
  assetId, 
  assetName, 
  assetSymbol,
  currency,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: AssetDetailDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [dividends, setDividends] = useState<DividendWithPayout[]>([]);
  const [dividendMetrics, setDividendMetrics] = useState({
    totalDividends: 0,
    ytdDividends: 0,
    dividendYield: 0,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    // Load transactions and profit for all assets
    const promises: Promise<any>[] = [
      getAssetTransactions(assetId),
      calculateAssetProfit(assetId),
    ];
    
    // Load dividends only if asset has a symbol
    if (assetSymbol) {
      promises.push(getDividendsWithPayouts(assetId));
      promises.push(calculateDividendMetrics(assetId));
    }
    
    const results = await Promise.all(promises);
    
    setTransactions(results[0]);
    if (!('error' in results[1])) {
      setProfitData(results[1]);
    }
    
    // Set dividend data if we fetched it
    if (assetSymbol && results.length > 2) {
      setDividends(results[2]);
      setDividendMetrics(results[3]);
    }
    
    setIsLoading(false);
  }, [assetId, assetSymbol]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleDeleteTransaction = useCallback(async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    const result = await deleteTransaction(transactionId);
    if (result.success) {
      loadData(); // Reload data after deletion
    } else if (result.error) {
      alert(result.error);
    }
  }, [loadData]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assetName}</DialogTitle>
          <DialogDescription>
            {assetSymbol && `${assetSymbol} • `}Transaction history and performance
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="dividends" disabled={!assetSymbol}>Dividends</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Show current price if no transactions */}
                {profitData && profitData.totalShares === 0 && (
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-semibold mb-3">Asset Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Symbol</div>
                        <div className="font-medium">{assetSymbol || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current Price</div>
                        <div className="font-medium">{currency} {profitData.currentPrice.toFixed(2)}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Shares Owned</div>
                        <div className="font-medium">0</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-muted/30 rounded text-sm text-muted-foreground text-center">
                      No transactions yet. Add your first transaction to track performance.
                    </div>
                  </div>
                )}
                
                {/* Profit Summary */}
                {profitData && profitData.totalShares > 0 && (
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-semibold mb-3">Performance Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Shares</div>
                        <div className="font-medium">{profitData.totalShares.toFixed(4)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Cost Basis</div>
                        <div className="font-medium">{currency} {profitData.avgCostBasis.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current Price</div>
                        <div className="font-medium">{currency} {profitData.currentPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current Value</div>
                        <div className="font-medium">{currency} {profitData.currentValue.toFixed(2)}</div>
                      </div>
                      <div>
                          <div className="text-muted-foreground">Unrealized Gain/Loss</div>
                        <div className={`font-medium flex items-center gap-1 ${profitData.unrealizedGain >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                          {profitData.unrealizedGain >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {profitData.unrealizedGain >= 0 ? '+' : ''}{currency} {profitData.unrealizedGain.toFixed(2)}
                          <span className="text-xs">({profitData.gainPercentage.toFixed(2)}%)</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Realized Gain/Loss</div>
                        <div className={`font-medium ${profitData.realizedGain >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                          {profitData.realizedGain >= 0 ? '+' : ''}{currency} {profitData.realizedGain.toFixed(2)}
                        </div>
                      </div>
                      {assetSymbol && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground">Dividend Income</div>
                          <div className={`font-medium ${(profitData.dividendIncome ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-muted-foreground'}`}>
                            {(profitData.dividendIncome ?? 0) > 0 ? '+' : ''}{currency} {(profitData.dividendIncome ?? 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                      <div className="col-span-2 pt-2 border-t">
                        <div className="text-muted-foreground">Total Return{assetSymbol ? ' (incl. dividends)' : ''}</div>
                        <div className={`font-semibold text-lg flex items-center gap-1 ${profitData.totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                          {profitData.totalGain >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                          {profitData.totalGain >= 0 ? '+' : ''}{currency} {profitData.totalGain.toFixed(2)}
                          <span className="text-sm">({profitData.gainPercentage.toFixed(2)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Transaction History</h3>
                    <AddTransactionDialog
                      assetId={assetId}
                      assetName={assetName}
                      assetSymbol={assetSymbol}
                      onTransactionAdded={loadData}
                    />
                  </div>

                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground rounded-lg border">
                      No transactions yet. Add your first transaction to track performance.
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Date</th>
                              <th className="text-left p-3 text-sm font-medium">Type</th>
                              <th className="text-right p-3 text-sm font-medium">Shares</th>
                              <th className="text-right p-3 text-sm font-medium">Price</th>
                              <th className="text-right p-3 text-sm font-medium">Total Value</th>
                              <th className="text-right p-3 text-sm font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {transactions.map((transaction) => (
                              <tr key={transaction.id} className="hover:bg-muted/30">
                                <td className="p-3 text-sm">
                                  {new Date(transaction.date).toISOString().split('T')[0]}
                                  {transaction.notes && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {transaction.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-sm">
                                  <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                                    transaction.type === 'buy' 
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                                  }`}>
                                    {transaction.type.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 text-sm text-right">
                                  {parseFloat(transaction.quantity).toFixed(4)}
                                </td>
                                <td className="p-3 text-sm text-right">
                                  {currency} {parseFloat(transaction.pricePerShare).toFixed(2)}
                                </td>
                                <td className="p-3 text-sm text-right font-medium">
                                  {currency} {parseFloat(transaction.totalValue).toFixed(2)}
                                </td>
                                <td className="p-3 text-sm text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Dividends Tab */}
              <TabsContent value="dividends">
                {assetSymbol && (
                  <DividendsSection 
                    assetId={assetId} 
                    assetSymbol={assetSymbol}
                    currency={currency}
                    dividends={dividends}
                    metrics={dividendMetrics}
                    onDividendsRefreshed={loadData}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

