import { getAssets } from './actions';
import { AddAssetDialog } from '@/components/add-asset-dialog';
import { RefreshPricesButton } from '@/components/refresh-prices-button';
import { AssetCard } from '@/components/asset-card';

export default async function Dashboard() {
  const assets = await getAssets();

  const totalAssets = assets.reduce(
    (sum, asset) => sum + parseFloat(asset.value),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">WealthManager</h1>
          <div className="ml-auto flex items-center space-x-4">
            <button className="text-sm font-medium text-muted-foreground hover:text-primary">
              Dashboard
            </button>
            <button className="text-sm font-medium text-muted-foreground hover:text-primary">
              Assets
            </button>
            <button className="text-sm font-medium text-muted-foreground hover:text-primary">
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-sm font-medium">Net Worth</div>
            <div className="text-2xl font-bold">
              ${totalAssets.toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-sm font-medium">Assets</div>
            <div className="text-2xl font-bold text-green-600">
              ${totalAssets.toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-sm font-medium">Liabilities</div>
            <div className="text-2xl font-bold text-red-600">$0.00</div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Assets</h3>
              <div className="flex gap-2">
                <RefreshPricesButton />
                <AddAssetDialog />
              </div>
            </div>
            <div className="mt-6">
              {assets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">
                    No assets added yet. Click "Add Asset" to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
