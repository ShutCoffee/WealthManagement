'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createAsset, createAssetWithPrice, searchStock } from '@/app/actions';
import { PlusCircle, TrendingUp, PieChart, Wallet, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AssetMode = 'choose' | 'stock' | 'etf' | 'manual';

interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export function AddAssetDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AssetMode>('choose');
  const formRef = useRef<HTMLFormElement>(null);

  // Stock/ETF search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);

  const selectedStockType = selectedStock?.type || 'Stock';
  const isEtfMode = mode === 'etf';

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset all state when dialog closes
      setMode('choose');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedStock(null);
      formRef.current?.reset();
    }
  }

  // Real-time search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || (mode !== 'stock' && mode !== 'etf') || selectedStock) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchStock(searchQuery);
      setIsSearching(false);

      if (result.success && result.results) {
        setSearchResults(result.results);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, mode, selectedStock]);

  function handleSelectStock(stock: StockSearchResult) {
    setSelectedStock(stock);
    setSearchResults([]);
    setSearchQuery('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    let result;
    
    if ((mode === 'stock' || mode === 'etf') && selectedStock) {
      // For stock/ETF mode, use createAssetWithPrice to fetch price immediately
      formData.set('name', selectedStock.name);
      formData.set('symbol', selectedStock.symbol);
      formData.set('currency', selectedStock.currency || 'USD');
      formData.set('type', 'investment');
      formData.set('category', isEtfMode ? 'etfs' : 'stocks');
      result = await createAssetWithPrice(formData);
    } else {
      // For manual mode, use regular createAsset
      result = await createAsset(formData);
    }

    setIsLoading(false);

    if (result.success) {
      setOpen(false);
      setMode('choose');
      setSelectedStock(null);
      setSearchQuery('');
      setSearchResults([]);
      formRef.current?.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "sm:max-w-[600px] transition-all duration-300",
        mode !== 'choose' && "sm:max-w-[500px]"
      )}>
        {mode === 'choose' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Asset</DialogTitle>
              <DialogDescription>
                Choose how you'd like to track your asset.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
              <button
                onClick={() => setMode('stock')}
                className="group flex flex-col items-center justify-center p-6 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-1">Stock</h3>
                <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
                  Real-time tracking for public companies
                </p>
              </button>

              <button
                onClick={() => setMode('etf')}
                className="group flex flex-col items-center justify-center p-6 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <PieChart className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-base mb-1">ETF</h3>
                <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
                  Track exchange-traded funds automatically
                </p>
              </button>

              <button
                onClick={() => setMode('manual')}
                className="group flex flex-col items-center justify-center p-6 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all duration-200"
              >
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Wallet className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-base mb-1">Manual</h3>
                <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
                  Cash, Real Estate, Crypto, or custom assets
                </p>
              </button>
            </div>
          </>
        )}

        {mode === 'stock' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Stock</DialogTitle>
              <DialogDescription>
                Search for a stock ticker and enter the number of shares you own.
              </DialogDescription>
            </DialogHeader>

            {!selectedStock ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stock-search">Search Stock Ticker</Label>
                  <div className="relative">
                    <Input
                      id="stock-search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., AAPL, MSFT, Tesla"
                      className="pr-10"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    <Label className="text-xs text-muted-foreground font-normal uppercase tracking-wider">Search Results</Label>
                    <div className="space-y-2">
                      {searchResults.map((stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          onClick={() => handleSelectStock(stock)}
                          className="w-full p-3 text-left rounded-lg border hover:border-primary hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold group-hover:text-primary transition-colors">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{stock.currency}</div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">{stock.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 opacity-70">
                            {stock.type || 'Stock'} • {stock.region}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try searching for a different ticker symbol</p>
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode('choose')}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-xl">{selectedStock.symbol}</div>
                    <div className="text-sm font-medium">{selectedStock.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
                      <span className="bg-background border px-1.5 py-0.5 rounded text-[10px] uppercase">{selectedStockType}</span>
                      <span>{selectedStock.region}</span>
                      <span>{selectedStock.currency}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedStock(null)}
                  >
                    Change
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-quantity">Number of Shares</Label>
                  <Input
                    id="stock-quantity"
                    name="quantity"
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 10"
                    required
                    autoFocus
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-notes">Notes (Optional)</Label>
                  <Input
                    id="stock-notes"
                    name="description"
                    placeholder="e.g., Brokerage account"
                  />
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedStock(null)}
                  >
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Stock
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </>
        )}

        {mode === 'etf' && (
          <>
            <DialogHeader>
              <DialogTitle>Add ETF</DialogTitle>
              <DialogDescription>
                Search for an ETF ticker and enter the number of shares you own.
              </DialogDescription>
            </DialogHeader>

            {!selectedStock ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="etf-search">Search ETF Ticker</Label>
                  <div className="relative">
                    <Input
                      id="etf-search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., SPY, QQQ, VTI"
                      className="pr-10"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    <Label className="text-xs text-muted-foreground font-normal uppercase tracking-wider">Search Results</Label>
                    <div className="space-y-2">
                      {searchResults.map((stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          onClick={() => handleSelectStock(stock)}
                          className="w-full p-3 text-left rounded-lg border hover:border-primary hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-semibold group-hover:text-primary transition-colors">{stock.symbol}</div>
                            <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{stock.currency}</div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">{stock.name}</div>
                          <div className="text-xs text-muted-foreground mt-1 opacity-70">
                            {stock.type || 'ETF'} • {stock.region}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try searching for a different ticker symbol</p>
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode('choose')}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-xl">{selectedStock.symbol}</div>
                    <div className="text-sm font-medium">{selectedStock.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
                      <span className="bg-background border px-1.5 py-0.5 rounded text-[10px] uppercase">{selectedStockType}</span>
                      <span>{selectedStock.region}</span>
                      <span>{selectedStock.currency}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setSelectedStock(null)}
                  >
                    Change
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etf-quantity">Number of Shares</Label>
                  <Input
                    id="etf-quantity"
                    name="quantity"
                    type="number"
                    step="0.0001"
                    placeholder="e.g., 10"
                    required
                    autoFocus
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etf-notes">Notes (Optional)</Label>
                  <Input
                    id="etf-notes"
                    name="description"
                    placeholder="e.g., Brokerage account"
                  />
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedStock(null)}
                  >
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add ETF
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </>
        )}

        {mode === 'manual' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Asset Manually</DialogTitle>
              <DialogDescription>
                Manually add any asset to track in your portfolio.
              </DialogDescription>
            </DialogHeader>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-name">Asset Name</Label>
                <Input
                  id="manual-name"
                  name="name"
                  placeholder="e.g., Chase Checking, Investment Portfolio"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-type">Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Account</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="property">Property</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-category">Category (Optional)</Label>
                  <Input
                    id="manual-category"
                    name="category"
                    placeholder="e.g., Checking"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-value">Value</Label>
                  <Input
                    id="manual-value"
                    name="value"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-currency">Currency</Label>
                  <Select name="currency" defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-description">Description (Optional)</Label>
                <Input
                  id="manual-description"
                  name="description"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode('choose')}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Asset
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
