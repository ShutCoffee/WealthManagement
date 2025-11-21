'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getAssetTransactions, calculateAssetProfit, deleteTransaction } from '@/app/actions';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, assetId]);

  async function loadData() {
    setIsLoading(true);
    const [txns, profit] = await Promise.all([
      getAssetTransactions(assetId),
      calculateAssetProfit(assetId),
    ]);
    setTransactions(txns);
    if (!('error' in profit)) {
      setProfitData(profit);
    }
    setIsLoading(false);
  }

  async function handleDeleteTransaction(transactionId: number) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    const result = await deleteTransaction(transactionId);
    if (result.success) {
      loadData(); // Reload data after deletion
    } else if (result.error) {
      alert(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assetName}</DialogTitle>
          <DialogDescription>
            {assetSymbol && `${assetSymbol} • `}Transaction history and performance
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
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
                    <div className={`font-medium flex items-center gap-1 ${profitData.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitData.unrealizedGain >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {profitData.unrealizedGain >= 0 ? '+' : ''}{currency} {profitData.unrealizedGain.toFixed(2)}
                      <span className="text-xs">({profitData.gainPercentage.toFixed(2)}%)</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Realized Gain/Loss</div>
                    <div className={`font-medium ${profitData.realizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitData.realizedGain >= 0 ? '+' : ''}{currency} {profitData.realizedGain.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-2 pt-2 border-t">
                    <div className="text-muted-foreground">Total Gain/Loss</div>
                    <div className={`font-semibold text-lg ${profitData.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitData.totalGain >= 0 ? '+' : ''}{currency} {profitData.totalGain.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction List */}
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
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                            transaction.type === 'buy' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.type.toUpperCase()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toISOString().split('T')[0]}
                          </span>
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="font-medium">{parseFloat(transaction.quantity).toFixed(4)}</span> shares
                          {' @ '}
                          <span className="font-medium">{currency} {parseFloat(transaction.pricePerShare).toFixed(2)}</span>
                        </div>
                        {transaction.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {transaction.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold">
                            {currency} {parseFloat(transaction.totalValue).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

