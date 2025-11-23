/**
 * Stock Price API Service using Alpha Vantage
 * Free tier: 25 API calls/day
 * Note: TIME_SERIES_DAILY_ADJUSTED requires premium, using TIME_SERIES_DAILY instead
 * Get your free API key at: https://www.alphavantage.co/support/#api-key
 */

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export interface StockQuote {
  symbol: string;
  price: number;
  currency: string;
  lastUpdated: Date;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export async function searchStockSymbol(keyword: string): Promise<StockSearchResult[]> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('ALPHA_VANTAGE_API_KEY is not set in environment variables');
    return [];
  }

  try {
    const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(keyword)}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    // Check for API errors
    if (data['Error Message']) {
      console.error('Alpha Vantage API error:', data['Error Message']);
      return [];
    }

    if (data['Note']) {
      console.warn('Alpha Vantage rate limit warning:', data['Note']);
      return [];
    }

    const matches = data.bestMatches || [];
    
    // Map Alpha Vantage response to our format
    return matches.slice(0, 10).map((item: any) => ({
      symbol: item['1. symbol'],
      name: item['2. name'],
      type: item['3. type'] || 'Equity',
      region: item['4. region'] || 'US',
      currency: item['8. currency'] || 'USD',
    }));
  } catch (error) {
    console.error('Failed to search stock symbol:', error);
    return [];
  }
}

export async function getStockPrice(symbol: string): Promise<StockQuote | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('ALPHA_VANTAGE_API_KEY is not set in environment variables');
    return null;
  }

  try {
    // Check if it's a crypto symbol (contains common crypto indicators)
    const isCrypto = symbol.includes('-') || symbol.includes('/') || 
                     ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'ADA', 'DOGE', 'XRP'].includes(symbol.split('-')[0]?.toUpperCase() || '');

    if (isCrypto) {
      return await getCryptoPrice(symbol);
    }

    // For stocks and ETFs, use GLOBAL_QUOTE
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    // Check for API errors
    if (data['Error Message']) {
      console.error(`Alpha Vantage API error for ${symbol}:`, data['Error Message']);
      return null;
    }

    if (data['Note']) {
      console.warn('Alpha Vantage rate limit hit:', data['Note']);
      return null;
    }

    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      console.error(`No quote data found for symbol: ${symbol}`);
      return null;
    }

    return {
      symbol: symbol,
      price: parseFloat(quote['05. price']),
      currency: 'USD',
      lastUpdated: new Date(quote['07. latest trading day'] || Date.now()),
    };
  } catch (error) {
    console.error(`Failed to fetch stock price for ${symbol}:`, error);
    return null;
  }
}

async function getCryptoPrice(symbol: string): Promise<StockQuote | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  try {
    // Parse crypto symbol (e.g., "BTC-USD" or "BTC")
    const [fromCurrency, toCurrency = 'USD'] = symbol.split('-');
    
    const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    if (data['Error Message']) {
      console.error(`Alpha Vantage API error for ${symbol}:`, data['Error Message']);
      return null;
    }

    const rate = data['Realtime Currency Exchange Rate'];
    
    if (!rate || !rate['5. Exchange Rate']) {
      console.error(`No crypto data found for symbol: ${symbol}`);
      return null;
    }

    return {
      symbol: symbol,
      price: parseFloat(rate['5. Exchange Rate']),
      currency: toCurrency,
      lastUpdated: new Date(rate['6. Last Refreshed'] || Date.now()),
    };
  } catch (error) {
    console.error(`Failed to fetch crypto price for ${symbol}:`, error);
    return null;
  }
}

export async function getMultipleStockPrices(
  symbols: string[]
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();

  // Alpha Vantage free tier: 25 calls/day total
  // Be very conservative with API usage
  for (const symbol of symbols) {
    const quote = await getStockPrice(symbol);
    if (quote) {
      results.set(symbol, quote);
    }
    // Small delay between requests to avoid rate limiting
    if (symbols.indexOf(symbol) < symbols.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export interface DividendData {
  exDate: Date;
  paymentDate: Date | null;
  amount: number;
  currency: string;
}

export interface HistoricalPricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch dividend history for a stock symbol
 * Uses Alpha Vantage DIVIDENDS endpoint
 * Returns CSV format by default
 */
export async function getDividendHistory(symbol: string): Promise<DividendData[]> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('ALPHA_VANTAGE_API_KEY is not set in environment variables');
    return [];
  }

  try {
    // Request CSV format (default for Alpha Vantage DIVIDENDS endpoint)
    const url = `${BASE_URL}?function=DIVIDENDS&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}&datatype=csv`;

    const response = await fetch(url, { cache: 'no-store' });
    const csvText = await response.text();

    // Check for API errors in text response
    if (csvText.includes('Error Message') || csvText.includes('"Note"')) {
      console.error(`Alpha Vantage API error for ${symbol}:`, csvText);
      return [];
    }

    // Parse CSV
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      console.warn(`No dividend data found for ${symbol}`);
      return [];
    }

    // Skip header row and parse data rows
    const dividendData: DividendData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      
      if (values.length >= 5) {
        const exDate = values[0];
        const paymentDate = values[3];
        const amount = values[4];
        
        // Skip invalid rows
        if (!exDate || !amount || amount === 'None') continue;
        
        dividendData.push({
          exDate: new Date(exDate),
          paymentDate: paymentDate && paymentDate !== 'None' ? new Date(paymentDate) : null,
          amount: parseFloat(amount),
          currency: 'USD',
        });
      }
    }

    console.log(`Fetched ${dividendData.length} dividend records for ${symbol}`);
    return dividendData;
  } catch (error) {
    console.error(`Failed to fetch dividend history for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch historical price data for a stock symbol
 * Supports different time ranges: 1M, 3M, 6M, 1Y, YTD, All
 * Note: Using TIME_SERIES_DAILY instead of DAILY_ADJUSTED (which requires premium)
 */
export async function getHistoricalPrices(
  symbol: string,
  range: string = '1Y'
): Promise<HistoricalPricePoint[]> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('ALPHA_VANTAGE_API_KEY is not set in environment variables');
    return [];
  }

  try {
    // Use TIME_SERIES_DAILY (free tier) instead of DAILY_ADJUSTED (premium)
    let functionName = 'TIME_SERIES_DAILY';
    let outputsize = 'compact'; // Last 100 data points
    
    if (range === 'All' || range === '5Y') {
      outputsize = 'full'; // Up to 20 years of data
    }

    const url = `${BASE_URL}?function=${functionName}&symbol=${encodeURIComponent(symbol)}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    // Check for API errors
    if (data['Error Message']) {
      console.error(`Alpha Vantage API error for ${symbol}:`, data['Error Message']);
      return [];
    }

    if (data['Note']) {
      console.warn('Alpha Vantage rate limit hit:', data['Note']);
      return [];
    }

    if (data['Information']) {
      console.error(`Alpha Vantage API limitation for ${symbol}:`, data['Information']);
      return [];
    }

    const timeSeries = data['Time Series (Daily)'] || {};
    const pricePoints: HistoricalPricePoint[] = [];

    // Convert to array and filter by date range
    const now = new Date();
    const cutoffDate = new Date(now);
    
    switch (range) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'YTD':
        cutoffDate.setMonth(0);
        cutoffDate.setDate(1);
        break;
      case 'All':
      case '5Y':
        cutoffDate.setFullYear(now.getFullYear() - 100); // Get all data
        break;
    }

    for (const [date, values] of Object.entries(timeSeries)) {
      const dateObj = new Date(date);
      if (dateObj >= cutoffDate) {
        pricePoints.push({
          date,
          open: parseFloat((values as any)['1. open']),
          high: parseFloat((values as any)['2. high']),
          low: parseFloat((values as any)['3. low']),
          close: parseFloat((values as any)['4. close']),
          volume: parseInt((values as any)['5. volume']), // Note: field 5 in DAILY (not 6 like in DAILY_ADJUSTED)
        });
      }
    }

    // Sort by date ascending (oldest first)
    pricePoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return pricePoints;
  } catch (error) {
    console.error(`Failed to fetch historical prices for ${symbol}:`, error);
    return [];
  }
}

/**
 * Get the closing price for a specific stock on a specific date
 * If exact date not available (weekend/holiday), returns the most recent previous trading day
 * Note: Using TIME_SERIES_DAILY instead of DAILY_ADJUSTED (which requires premium)
 */
export async function getStockPriceOnDate(
  symbol: string, 
  date: string
): Promise<{ price: number; actualDate: string } | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('ALPHA_VANTAGE_API_KEY is not set in environment variables');
    return null;
  }

  try {
    // Use TIME_SERIES_DAILY (free tier) instead of DAILY_ADJUSTED (premium)
    const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    // Check for API errors
    if (data['Error Message']) {
      console.error(`Alpha Vantage API error for ${symbol}:`, data['Error Message']);
      return null;
    }

    if (data['Note']) {
      console.warn('Alpha Vantage rate limit hit:', data['Note']);
      return null;
    }

    if (data['Information']) {
      console.error(`Alpha Vantage API limitation for ${symbol}:`, data['Information']);
      return null;
    }

    const timeSeries = data['Time Series (Daily)'] || {};
    const targetDate = new Date(date);
    
    // Try to find exact date first
    if (timeSeries[date]) {
      return {
        price: parseFloat(timeSeries[date]['4. close']), // Use '4. close' instead of '5. adjusted close'
        actualDate: date
      };
    }

    // If not found (weekend/holiday), find the most recent previous trading day
    const sortedDates = Object.keys(timeSeries).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    for (const availableDate of sortedDates) {
      const availableDateObj = new Date(availableDate);
      if (availableDateObj <= targetDate) {
        return {
          price: parseFloat(timeSeries[availableDate]['4. close']), // Use '4. close' instead of '5. adjusted close'
          actualDate: availableDate
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol} on ${date}:`, error);
    return null;
  }
}



