# WealthManager Setup Guide

## Prerequisites

- Node.js 18+ installed
- A free [Neon](https://console.neon.tech) account for PostgreSQL database
- A free [Finnhub API key](https://finnhub.io/register) for stock price data

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host.region.neon.tech/dbname?sslmode=require

# Finnhub API Key (for stock price fetching)
FINNHUB_API_KEY=your_api_key_here

# Cron Secret (for automated price updates)
CRON_SECRET=your_random_secret_here
```

**Generate CRON_SECRET**: Use a random string generator or run:
```bash
openssl rand -base64 32
```

#### Getting Your Database URL

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Navigate to "Connection Details"
4. Copy the connection string

#### Getting Your Finnhub API Key

1. Visit [Finnhub Registration](https://finnhub.io/register)
2. Sign up with your email
3. Verify your email
4. Copy the API key from your dashboard
5. **Free tier**: 60 API calls per minute (effectively unlimited for personal use!)

### 3. Push Database Schema

```bash
npm run db:push
```

This creates the `assets` and `tickers` tables with all required fields.

### 4. Initialize Ticker Cache (One-time Setup)

The first time you search for a stock, the app will automatically download all US stock tickers from Finnhub and cache them locally. This takes about 10-15 seconds on first use but makes all future searches instant.

Alternatively, you can manually trigger the cache initialization by visiting the app and searching for any stock ticker.

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using Stock Price Auto-Update

### Adding Investment Assets

1. Click "Add Asset" button
2. Choose "Add Stock"
3. Search for ticker or company name (e.g., "AAPL" or "Apple")
   - Search is **instant** - searches local database, no API calls!
   - Results appear as you type
4. Select from results → Auto-fills company name, symbol, currency
5. Enter number of shares
6. Click "Add Stock" → **Price fetches immediately!**

### Manual Price Refresh

1. Click the "Refresh Prices" button on the dashboard
2. The system will:
   - Fetch current prices for all assets with symbols
   - Calculate new values based on quantity × price
   - Update the `lastPriceUpdate` timestamp
   - Show "Updated [date]" instead of "Added [date]"

**Important**: Finnhub free tier allows 60 calls/minute, so refreshing is nearly instant!

### Automated Daily Price Updates

The app supports automated daily price updates after market close (4 PM ET / 9 PM UTC).

#### Option 1: Vercel Cron Jobs (Recommended for Vercel Deployments)

1. Create `vercel.json` in the root directory:

```json
{
  "crons": [{
    "path": "/api/cron/refresh-prices",
    "schedule": "0 21 * * *"
  }]
}
```

2. Add `CRON_SECRET` to your Vercel environment variables:
   - Go to your Vercel project → Settings → Environment Variables
   - Add `CRON_SECRET` with your secret value

3. Deploy to Vercel - cron job will run automatically daily at 9 PM UTC (4 PM ET)

#### Option 2: External Cron Service (for any deployment)

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions
- Your server's crontab

Configure to call:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.com/api/cron/refresh-prices
```

Schedule: `0 21 * * *` (Daily at 9 PM UTC / 4 PM ET)

#### Option 3: Manual Scheduled Updates

If you prefer manual control, simply click the "Refresh Prices" button whenever you want to update your portfolio values. No automated setup needed!

## Supported Stock Symbols

The app caches all US stock tickers locally for instant search:
- US: AAPL, TSLA, GOOGL, MSFT, AMZN, and thousands more
- **~10,000+ US stocks** available in the local cache
- Search is instant (no API calls)
- Cache auto-initializes on first search

## Troubleshooting

### "No search results" when typing ticker
- First search initializes the ticker cache (takes 10-15 seconds)
- Wait for initialization to complete, then search again
- Cache persists in database for all future searches

### "No quote data found for symbol"
- Verify the ticker symbol is correct
- Check if it's a valid US stock symbol
- Currently only US stocks are supported

### "API key not set"
- Verify `FINNHUB_API_KEY` is in `.env.local`
- Restart your dev server after adding the key

### Cron job not running
- Verify `CRON_SECRET` is set in environment variables
- Check cron job logs in your deployment platform
- Test manually: `curl -H "Authorization: Bearer YOUR_SECRET" https://your-app.com/api/cron/refresh-prices`

### Database Connection Issues
- Verify `DATABASE_URL` is correct in `.env.local`
- Ensure your Neon database is active
- Check if IP whitelist is configured (if applicable)

## API Limits

Finnhub Free Tier:
- **60 API calls per minute**
- Real-time stock prices included
- No daily limit
- Perfect for personal portfolio tracking!

## Database Schema

The `assets` table includes:
- `id`: Primary key
- `name`: Asset name
- `type`: Asset type (bank, investment, property, crypto, other)
- `category`: Optional subcategory
- `value`: Current value
- `currency`: Currency code (USD, EUR, etc.)
- `symbol`: Stock ticker symbol (for investments)
- `quantity`: Number of shares/units
- `lastPriceUpdate`: Timestamp of last price fetch
- `createdAt`, `updatedAt`: Timestamps

The `tickers` table (cache) includes:
- `id`: Primary key
- `symbol`: Stock ticker symbol
- `name`: Company/stock name
- `type`: Stock type (Common Stock, ETF, etc.)
- `lastUpdated`: Cache update timestamp

## Next Steps

- Add more investment assets with ticker symbols
- Prices update automatically when adding stocks
- Use "Refresh Prices" button to manually update all stocks
- Set up automated daily price updates (see above)
- Add support for cryptocurrency price tracking
- Integrate Plaid API for bank account sync

## Support

For issues or questions, refer to:
- [Finnhub Documentation](https://finnhub.io/docs/api)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Next.js App Router Docs](https://nextjs.org/docs)

