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
import { PlusCircle, TrendingUp, Edit, Loader2 } from 'lucide-react';

type AssetMode = 'choose' | 'stock' | 'manual';

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

  // Stock search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);

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
    if (!searchQuery.trim() || mode !== 'stock' || selectedStock) {
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
    
    if (mode === 'stock' && selectedStock) {
      // For stock mode, use createAssetWithPrice to fetch price immediately
      formData.set('name', selectedStock.name);
      formData.set('symbol', selectedStock.symbol);
      formData.set('currency', selectedStock.currency || 'USD');
      formData.set('type', 'investment');
      formData.set('category', 'stocks');
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
      <DialogContent className="sm:max-w-[500px]">
        {mode === 'choose' && (
          <>
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>
                Choose how you'd like to add your asset.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                onClick={() => setMode('stock')}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-colors"
              >
                <TrendingUp className="h-12 w-12 mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-1">Add Stock</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Track stocks with auto-updating prices
                </p>
              </button>
              <button
                onClick={() => setMode('manual')}
                className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-colors"
              >
                <Edit className="h-12 w-12 mb-3 text-primary" />
                <h3 className="font-semibold text-lg mb-1">Manual Entry</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Add any asset type with custom values
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
                  <Label htmlFor="stock-search">Search Stock Ticker or Company</Label>
                  <div className="relative">
                    <Input
                      id="stock-search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., AAPL, Tesla, Microsoft"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <Label>Search Results</Label>
                    <div className="space-y-2">
                      {searchResults.map((stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          onClick={() => handleSelectStock(stock)}
                          className="w-full p-3 text-left rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-colors"
                        >
                          <div className="font-semibold">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {stock.region} • {stock.currency}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No results found. Try a different search term.
                  </div>
                )}

                <div className="flex justify-between gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
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
                <div className="rounded-lg border bg-accent p-4 space-y-1">
                  <div className="font-semibold text-lg">{selectedStock.symbol}</div>
                  <div className="text-sm">{selectedStock.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedStock.region} • {selectedStock.currency}
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setSelectedStock(null)}
                  >
                    Change stock
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock-notes">Notes (Optional)</Label>
                  <Input
                    id="stock-notes"
                    name="description"
                    placeholder="e.g., Bought in Robinhood"
                  />
                </div>

                <div className="flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
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
                      {isLoading ? 'Adding...' : 'Add Stock'}
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
                    placeholder="e.g., Checking, Stocks"
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

              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
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
                    {isLoading ? 'Adding...' : 'Add Asset'}
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

