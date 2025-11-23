'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getHistoricalPriceData } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  currency?: string;
}

const RANGE_OPTIONS = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'YTD', label: 'YTD' },
  { value: 'All', label: 'All' },
];

export function PriceChart({ symbol, currency = 'USD' }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState('1Y');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChartData();
  }, [symbol, selectedRange]);

  async function loadChartData() {
    setIsLoading(true);
    setError(null);

    const result = await getHistoricalPriceData(symbol, selectedRange);
    
    if ('error' in result) {
      setError(result.error || 'Failed to load chart data');
      setIsLoading(false);
      return;
    }

    if (result.data && result.data.length > 0) {
      // Format data for Recharts
      const formattedData = result.data.map((point) => ({
        date: new Date(point.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          ...(selectedRange === 'All' || selectedRange === '5Y' ? { year: '2-digit' } : {})
        }),
        price: point.close,
        fullDate: point.date,
      }));
      setChartData(formattedData);
    } else {
      setError('No data available for this symbol');
    }

    setIsLoading(false);
  }

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : 0;
  const priceChange = chartData.length >= 2 ? chartData[chartData.length - 1].price - chartData[0].price : 0;
  const priceChangePercent = chartData.length >= 2 && chartData[0].price > 0 
    ? ((priceChange / chartData[0].price) * 100).toFixed(2) 
    : '0.00';
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-4">
      {/* Header with range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Price History</h3>
          {!isLoading && chartData.length > 0 && (
            <div className={`text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
              {isPositive ? '+' : ''}{currency} {Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent}%)
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedRange === option.value ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setSelectedRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border bg-card p-4">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={loadChartData}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={isPositive ? 'hsl(142 76% 36%)' : 'hsl(346 84% 61%)'} 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={isPositive ? 'hsl(142 76% 36%)' : 'hsl(346 84% 61%)'} 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted))' }}
                axisLine={{ stroke: 'hsl(var(--muted))' }}
              />
              <YAxis 
                domain={[minPrice * 0.95, maxPrice * 1.05]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted))' }}
                axisLine={{ stroke: 'hsl(var(--muted))' }}
                tickFormatter={(value) => `${currency} ${value.toFixed(2)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: any) => [`${currency} ${parseFloat(value).toFixed(2)}`, 'Price']}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? 'hsl(142 76% 36%)' : 'hsl(346 84% 61%)'} 
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Data provided by Alpha Vantage. Note: API has 25 calls/day limit on free tier.
      </p>
    </div>
  );
}

