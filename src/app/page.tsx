import { getAssets, getAllDividendMetrics } from './actions';
import { AddAssetDialog } from '@/components/add-asset-dialog';
import { RefreshPricesButton } from '@/components/refresh-prices-button';
import { AssetCard } from '@/components/asset-card';
import { ModeToggle } from '@/components/mode-toggle';
import { PortfolioChart } from '@/components/portfolio-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';

export default async function Dashboard() {
  const assets = await getAssets();
  const dividendMetrics = await getAllDividendMetrics();

  const totalAssets = assets.reduce(
    (sum, asset) => sum + parseFloat(asset.value),
    0
  );

  // Placeholder for liabilities until implemented
  const totalLiabilities = 0;
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">WealthManager</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#" className="text-foreground hover:text-primary transition-colors">Dashboard</a>
              <a href="#" className="hover:text-primary transition-colors">Holdings</a>
              <a href="#" className="hover:text-primary transition-colors">Analytics</a>
            </nav>
            <div className="flex items-center gap-2 pl-4 border-l">
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Section */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Worth
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total value across all accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assets
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                ${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {assets.length} active assets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Liabilities
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
                ${totalLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Outstanding debts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                YTD Dividends
              </CardTitle>
              <Coins className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                ${dividendMetrics.totalYTDDividends.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Year-to-date income
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Assets List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Portfolio Holdings</h2>
                <p className="text-sm text-muted-foreground">Manage your assets and investments.</p>
              </div>
              <div className="flex gap-2">
                <RefreshPricesButton />
                <AddAssetDialog />
              </div>
            </div>

            <Card>
              <div className="divide-y">
                {assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <Wallet className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium">No assets found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                      Get started by adding your first asset to track your net worth.
                    </p>
                    <AddAssetDialog />
                  </div>
                ) : (
                  <div className="bg-card rounded-xl overflow-hidden">
                    {assets.map((asset) => (
                      <div key={asset.id} className="p-1 hover:bg-muted/30 transition-colors">
                         <AssetCard asset={asset} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Stats / Breakdown */}
          <div className="space-y-6">
            {/* Portfolio Chart */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <PortfolioChart assets={assets} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Simple mock distribution for visual - in real app would calculate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Investments</span>
                      <span className="text-muted-foreground">
                        {((assets.filter(a => a.type === 'investment').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-1" 
                        style={{ width: `${((assets.filter(a => a.type === 'investment').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Cash & Bank</span>
                      <span className="text-muted-foreground">
                        {((assets.filter(a => a.type === 'bank' || a.type === 'cash').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-2" 
                        style={{ width: `${((assets.filter(a => a.type === 'bank' || a.type === 'cash').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Real Estate</span>
                      <span className="text-muted-foreground">
                        {((assets.filter(a => a.type === 'real_estate').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-3" 
                        style={{ width: `${((assets.filter(a => a.type === 'real_estate').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Other</span>
                      <span className="text-muted-foreground">
                        {((assets.filter(a => a.type === 'other').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-chart-4" 
                        style={{ width: `${((assets.filter(a => a.type === 'other').reduce((sum, a) => sum + parseFloat(a.value), 0) / (totalAssets || 1)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
