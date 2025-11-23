import { useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { StockSearchResult } from './stock-search'

interface StockFormProps {
  selectedStock: StockSearchResult
  assetType: 'stock' | 'etf'
  isLoading: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
  onCancel: () => void
  onChangeStock: () => void
}

export function StockForm({
  selectedStock,
  assetType,
  isLoading,
  onSubmit,
  onBack,
  onCancel,
  onChangeStock,
}: StockFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const selectedStockType = selectedStock?.type || (assetType === 'etf' ? 'ETF' : 'Stock')

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4 flex items-start justify-between">
        <div className="space-y-1">
          <div className="font-bold text-xl">{selectedStock.symbol}</div>
          <div className="text-sm font-medium">{selectedStock.name}</div>
          <div className="text-xs text-muted-foreground flex gap-2 items-center mt-1">
            <span className="bg-background border px-1.5 py-0.5 rounded text-[10px] uppercase">
              {selectedStockType}
            </span>
            <span>{selectedStock.region}</span>
            <span>{selectedStock.currency}</span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={onChangeStock}
        >
          Change
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Number of Shares</Label>
        <Input
          id="quantity"
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
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input id="notes" name="description" placeholder="e.g., Brokerage account" />
      </div>

      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {assetType === 'etf' ? 'ETF' : 'Stock'}
          </Button>
        </div>
      </div>
    </form>
  )
}

