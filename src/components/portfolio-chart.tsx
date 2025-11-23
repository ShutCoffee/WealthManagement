'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

interface PortfolioChartProps {
  assets: Array<{
    id: number;
    value: string;
    type: string;
  }>;
}

const RANGE_OPTIONS = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'YTD', label: 'YTD' },
];

export function PortfolioChart({ assets }: PortfolioChartProps) {
  const [selectedRange, setSelectedRange] = useState('1Y');

  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.value), 0);

  // Generate mock historical data based on current value
  // In a real implementation, this would fetch actual historical portfolio values
  const generateMockData = () => {
    const dataPoints = selectedRange === '1Y' ? 12 : selectedRange === '6M' ? 6 : selectedRange === '3M' ? 3 : 1;
    const data = [];
    
    for (let i = dataPoints; i >= 0; i--) {
      const date = new Date();
      if (selectedRange === '1Y') {
        date.setMonth(date.getMonth() - i);
      } else if (selectedRange === '6M') {
        date.setMonth(date.getMonth() - i);
      } else if (selectedRange === '3M') {
        date.setMonth(date.getMonth() - i);
      } else if (selectedRange === '1M') {
        date.setDate(date.getDate() - i * 7);
      } else if (selectedRange === 'YTD') {
        date.setMonth(i === dataPoints ? 0 : date.getMonth() - i);
      }
      
      // Generate value with some variation (mock data)
      const variation = (Math.random() - 0.5) * 0.15; // ±7.5% variation
      const historicalValue = i === 0 ? totalValue : totalValue * (0.90 + (i / dataPoints) * 0.10 + variation);
      
      data.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          ...(selectedRange === '1M' ? { day: 'numeric' } : {}),
          ...(selectedRange === 'YTD' || selectedRange === '1Y' ? { year: '2-digit' } : {})
        }),
        value: historicalValue,
      });
    }
    
    return data;
  };

  const chartData = generateMockData();
  const minValue = Math.min(...chartData.map(d => d.value));
  const maxValue = Math.max(...chartData.map(d => d.value));
  const valueChange = chartData.length >= 2 ? chartData[chartData.length - 1].value - chartData[0].value : 0;
  const changePercent = chartData.length >= 2 && chartData[0].value > 0 
    ? ((valueChange / chartData[0].value) * 100).toFixed(2) 
    : '0.00';
  const isPositive = valueChange >= 0;

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="font-semibold">Portfolio Performance</h3>
          <div className={`text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
            {isPositive ? '+' : ''}${Math.abs(valueChange).toFixed(2)} ({isPositive ? '+' : ''}{changePercent}%)
          </div>
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
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
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
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              domain={[minValue * 0.95, maxValue * 1.05]} 
              hide={true} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: any) => [`$${parseFloat(value).toFixed(2)}`, 'Portfolio Value']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isPositive ? 'hsl(142 76% 36%)' : 'hsl(346 84% 61%)'} 
              strokeWidth={2}
              fill="url(#colorPortfolio)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-muted-foreground px-6 pb-4 pt-2">
        Note: Historical portfolio data is estimated based on current holdings.
      </p>
    </div>
  );
}

