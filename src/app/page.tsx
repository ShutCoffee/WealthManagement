import { getAssets, getAllDividendMetrics, calculateAssetsProfit, getLiabilities } from './actions'
import { AddAssetDialog } from '@/components/add-asset-dialog';
import { AddLiabilityDialog } from '@/components/add-liability-dialog';
import { RefreshPricesButton } from '@/components/refresh-prices-button';
import { AssetCard } from '@/components/asset-card';
import { LiabilityCard } from '@/components/liability-card';
import { ModeToggle } from '@/components/mode-toggle';
import { PortfolioChart } from '@/components/portfolio-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Asset, Liability } from '@/db/schema';

interface AssetWithProfit extends Asset {
  profitData?: {
    unrealizedGain: number;
    gainPercentage: number;
  };
}

interface AssetAllocationData {
  investments: AssetWithProfit[];
  cash: AssetWithProfit[];
  property: AssetWithProfit[];
  crypto: AssetWithProfit[];
  other: AssetWithProfit[];
}

function renderAssetList(assets: AssetWithProfit[], emptyMessage: string = "No assets in this category") {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted/50 p-4 rounded-full mb-4">
          <Wallet className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium">No assets found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-b-xl rounded-t-none overflow-hidden divide-y">
      {assets.map((asset) => (
        <div key={asset.id} className="p-1 hover:bg-muted/30 transition-colors">
          <AssetCard asset={asset} />
        </div>
      ))}
    </div>
  );
}

function renderLiabilityList(liabilities: Liability[], emptyMessage: string = "No liabilities in this category") {
  if (liabilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted/50 p-4 rounded-full mb-4">
          <TrendingDown className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium">No liabilities found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-b-xl rounded-t-none overflow-hidden divide-y">
      {liabilities.map((liability) => (
        <div key={liability.id} className="p-1 hover:bg-muted/30 transition-colors">
          <LiabilityCard liability={liability} />
        </div>
      ))}
    </div>
  );
}

function calculateAssetAllocation(assets: AssetWithProfit[]): AssetAllocationData {
  return {
    investments: assets.filter(a => a.type === 'investment'),
    cash: assets.filter(a => a.type === 'bank' || a.type === 'cash'),
    property: assets.filter(a => a.type === 'property' || a.type === 'real_estate'),
    crypto: assets.filter(a => a.type === 'crypto'),
    other: assets.filter(a => !['investment', 'bank', 'cash', 'property', 'real_estate', 'crypto'].includes(a.type))
  };
}

function calculateAllocationPercentage(categoryAssets: AssetWithProfit[], totalAssets: number): string {
  const categoryValue = categoryAssets.reduce((sum, a) => sum + parseFloat(a.value), 0);
  return ((categoryValue / (totalAssets || 1)) * 100).toFixed(1);
}

interface AllocationBarProps {
  label: string;
  percentage: string;
  color: string;
}

function AllocationBar({ label, percentage, color }: AllocationBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`}
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const [assets, dividendMetrics, liabilities] = await Promise.all([
    getAssets(),
    getAllDividendMetrics(),
    getLiabilities(),
  ]);

  // Get IDs of investment assets that need profit calculation
  const investmentAssetIds = assets
    .filter(a => a.type === 'investment' && a.symbol)
    .map(a => a.id);

  // Calculate profit data for all investment assets in a single optimized batch
  const profitDataMap = await calculateAssetsProfit(investmentAssetIds);

  // Merge profit data with assets
  const assetsWithProfit: AssetWithProfit[] = assets.map((asset) => {
    if (asset.type === 'investment' && asset.symbol && profitDataMap[asset.id]) {
      const profitResult = profitDataMap[asset.id]
      if (!('error' in profitResult)) {
        return {
          ...asset,
          profitData: {
            unrealizedGain: profitResult.unrealizedGain,
            gainPercentage: profitResult.gainPercentage,
          },
        }
      }
    }
    return asset
  })

  const totalAssets = assetsWithProfit.reduce(
    (sum, asset) => sum + parseFloat(asset.value),
    0
  );

  // Calculate total liabilities
  const totalLiabilities = liabilities.reduce(
    (sum, liability) => sum + parseFloat(liability.balance),
    0
  );

  // Categorize assets
  const allocation = calculateAssetAllocation(assetsWithProfit);
  const { investments, cash, property, crypto, other } = allocation;

  // Categorize liabilities
  const mortgages = liabilities.filter(l => l.type === 'mortgage');
  const creditCards = liabilities.filter(l => l.type === 'credit_card');
  const loans = liabilities.filter(l => ['student_loan', 'auto_loan', 'personal_loan', 'line_of_credit'].includes(l.type));
  const otherLiabilities = liabilities.filter(l => !['mortgage', 'credit_card', 'student_loan', 'auto_loan', 'personal_loan', 'line_of_credit'].includes(l.type));

  // Calculate net worth
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
                  {assetsWithProfit.length} active assets
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

        {/* Main Tabs - Top Level */}
        <Tabs defaultValue="assets" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="assets" className="gap-2">
                Assets
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                  {assetsWithProfit.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="liabilities" className="gap-2">
                Liabilities
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                  {liabilities.length}
                </span>
              </TabsTrigger>
            </TabsList>
            <RefreshPricesButton />
          </div>

          {/* Assets Tab Content */}
          <TabsContent value="assets" className="m-0">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Assets List */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-5">
                    <div className="space-y-1">
                      <CardTitle>Assets</CardTitle>
                      <CardDescription>Your investments and holdings</CardDescription>
                    </div>
                    <AddAssetDialog />
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="all" className="w-full">
                      <div className="px-5 pb-4">
                        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="investment">Investments</TabsTrigger>
                          <TabsTrigger value="cash">Cash</TabsTrigger>
                          <TabsTrigger value="property">Property</TabsTrigger>
                          <TabsTrigger value="crypto">Crypto</TabsTrigger>
                          <TabsTrigger value="other">Other</TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <div className="px-0">
                        <TabsContent value="all" className="m-0 border-t">
                          {assetsWithProfit.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
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
                            renderAssetList(assetsWithProfit, "No assets found.")
                          )}
                        </TabsContent>
                        <TabsContent value="investment" className="m-0 border-t">
                          {renderAssetList(investments, "No investment assets found.")}
                        </TabsContent>
                        <TabsContent value="cash" className="m-0 border-t">
                          {renderAssetList(cash, "No cash accounts found.")}
                        </TabsContent>
                        <TabsContent value="property" className="m-0 border-t">
                          {renderAssetList(property, "No property assets found.")}
                        </TabsContent>
                        <TabsContent value="crypto" className="m-0 border-t">
                          {renderAssetList(crypto, "No crypto assets found.")}
                        </TabsContent>
                        <TabsContent value="other" className="m-0 border-t">
                          {renderAssetList(other, "No other assets found.")}
                        </TabsContent>
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Assets Sidebar */}
              <div className="space-y-6">
                {/* Portfolio Chart */}
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <PortfolioChart assets={assetsWithProfit} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <AllocationBar
                        label="Investments"
                        percentage={calculateAllocationPercentage(investments, totalAssets)}
                        color="bg-chart-1"
                      />
                      <AllocationBar
                        label="Cash & Bank"
                        percentage={calculateAllocationPercentage(cash, totalAssets)}
                        color="bg-chart-2"
                      />
                      <AllocationBar
                        label="Property"
                        percentage={calculateAllocationPercentage(property, totalAssets)}
                        color="bg-chart-3"
                      />
                      <AllocationBar
                        label="Crypto"
                        percentage={calculateAllocationPercentage(crypto, totalAssets)}
                        color="bg-violet-500"
                      />
                      <AllocationBar
                        label="Other"
                        percentage={calculateAllocationPercentage(other, totalAssets)}
                        color="bg-chart-4"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Liabilities Tab Content */}
          <TabsContent value="liabilities" className="m-0">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Liabilities List */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-5">
                    <div className="space-y-1">
                      <CardTitle>Liabilities</CardTitle>
                      <CardDescription>Your debts and obligations</CardDescription>
                    </div>
                    <AddLiabilityDialog />
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="all" className="w-full">
                      <div className="px-5 pb-4">
                        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="mortgage">Mortgages</TabsTrigger>
                          <TabsTrigger value="credit_card">Credit Cards</TabsTrigger>
                          <TabsTrigger value="loan">Loans</TabsTrigger>
                          <TabsTrigger value="other">Other</TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <div className="px-0">
                        <TabsContent value="all" className="m-0 border-t">
                          {liabilities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                              <div className="bg-muted/50 p-4 rounded-full mb-4">
                                <TrendingDown className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                              <h3 className="text-lg font-medium">No liabilities found</h3>
                              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                                Add liabilities to track your debts and obligations.
                              </p>
                              <AddLiabilityDialog />
                            </div>
                          ) : (
                            renderLiabilityList(liabilities, "No liabilities found.")
                          )}
                        </TabsContent>
                        <TabsContent value="mortgage" className="m-0 border-t">
                          {renderLiabilityList(mortgages, "No mortgages found.")}
                        </TabsContent>
                        <TabsContent value="credit_card" className="m-0 border-t">
                          {renderLiabilityList(creditCards, "No credit cards found.")}
                        </TabsContent>
                        <TabsContent value="loan" className="m-0 border-t">
                          {renderLiabilityList(loans, "No loans found.")}
                        </TabsContent>
                        <TabsContent value="other" className="m-0 border-t">
                          {renderLiabilityList(otherLiabilities, "No other liabilities found.")}
                        </TabsContent>
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Liabilities Sidebar - Placeholder for future liability-specific charts */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Liability Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between items-center mb-2">
                          <span>Mortgages</span>
                          <span className="font-semibold">${mortgages.reduce((sum, l) => sum + parseFloat(l.balance), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Credit Cards</span>
                          <span className="font-semibold">${creditCards.reduce((sum, l) => sum + parseFloat(l.balance), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span>Loans</span>
                          <span className="font-semibold">${loans.reduce((sum, l) => sum + parseFloat(l.balance), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Other</span>
                          <span className="font-semibold">${otherLiabilities.reduce((sum, l) => sum + parseFloat(l.balance), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
