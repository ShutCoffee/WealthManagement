'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAsset, createAssetWithPrice } from '@/app/actions'
import { PlusCircle, TrendingUp, PieChart, Wallet, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StockSearch, type StockSearchResult } from '@/components/stock-search'
import { StockForm } from '@/components/stock-form'

type AssetMode = 'choose' | 'stock' | 'etf' | 'manual'

export function AddAssetDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<AssetMode>('choose')
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null)

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setMode('choose')
      setSelectedStock(null)
      formRef.current?.reset()
    }
  }, [])

  const handleSelectStock = useCallback((stock: StockSearchResult) => {
    setSelectedStock(stock)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    
    let result
    
    if ((mode === 'stock' || mode === 'etf') && selectedStock) {
      formData.set('name', selectedStock.name)
      formData.set('symbol', selectedStock.symbol)
      formData.set('currency', selectedStock.currency || 'USD')
      formData.set('type', 'investment')
      formData.set('category', mode === 'etf' ? 'etfs' : 'stocks')
      result = await createAssetWithPrice(formData)
    } else {
      result = await createAsset(formData)
    }

    setIsLoading(false)

    if (result.success) {
      setOpen(false)
      setMode('choose')
      setSelectedStock(null)
      formRef.current?.reset()
    }
  }, [mode, selectedStock])

  const handleSetMode = useCallback((newMode: AssetMode) => {
    setMode(newMode)
  }, [])

  const handleBackToChoose = useCallback(() => {
    setMode('choose')
  }, [])

  const handleClearStock = useCallback(() => {
    setSelectedStock(null)
  }, [])

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
                onClick={() => handleSetMode('stock')}
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
                onClick={() => handleSetMode('etf')}
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
                onClick={() => handleSetMode('manual')}
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

        {(mode === 'stock' || mode === 'etf') && (
          <>
            <DialogHeader>
              <DialogTitle>Add {mode === 'etf' ? 'ETF' : 'Stock'}</DialogTitle>
              <DialogDescription>
                Search for a {mode === 'etf' ? 'ETF' : 'stock'} ticker and enter the number of shares you own.
              </DialogDescription>
            </DialogHeader>

            {!selectedStock ? (
              <StockSearch
                placeholder={mode === 'etf' ? 'e.g., SPY, QQQ, VTI' : 'e.g., AAPL, MSFT, Tesla'}
                onSelect={handleSelectStock}
                onBack={handleBackToChoose}
                onCancel={() => handleOpenChange(false)}
              />
            ) : (
              <StockForm
                selectedStock={selectedStock}
                assetType={mode}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                onBack={handleClearStock}
                onCancel={() => handleOpenChange(false)}
                onChangeStock={handleClearStock}
              />
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
                  onClick={handleBackToChoose}
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
  )
}
