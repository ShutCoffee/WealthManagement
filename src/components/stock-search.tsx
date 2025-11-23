import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { searchStock } from '@/app/actions'

interface StockSearchResult {
  symbol: string
  name: string
  type: string
  region: string
  currency: string
}

interface StockSearchProps {
  placeholder: string
  onSelect: (stock: StockSearchResult) => void
  onBack: () => void
  onCancel: () => void
}

export function StockSearch({ placeholder, onSelect, onBack, onCancel }: StockSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true)
      const result = await searchStock(searchQuery)
      setIsSearching(false)

      if (result.success && result.results) {
        setSearchResults(result.results)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stock-search">Search Ticker</Label>
        <div className="relative">
          <Input
            id="stock-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
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
          <Label className="text-xs text-muted-foreground font-normal uppercase tracking-wider">
            Search Results
          </Label>
          <div className="space-y-2">
            {searchResults.map((stock) => (
              <button
                key={stock.symbol}
                type="button"
                onClick={() => onSelect(stock)}
                className="w-full p-3 text-left rounded-lg border hover:border-primary hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold group-hover:text-primary transition-colors">
                    {stock.symbol}
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {stock.currency}
                  </div>
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
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export type { StockSearchResult }

