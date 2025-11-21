import { NextResponse } from 'next/server';
import { refreshStockPrices } from '@/app/actions';

/**
 * Cron endpoint for automated daily price refresh
 * Schedule: Daily at 4 PM ET (after US market close)
 * 
 * Security: Requires CRON_SECRET in Authorization header
 * 
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-prices",
 *     "schedule": "0 21 * * *"
 *   }]
 * }
 * 
 * Manual trigger:
 * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/refresh-prices
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    console.error('Unauthorized cron request attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting scheduled price refresh...');
    const result = await refreshStockPrices();
    
    if (result.error) {
      console.error('Price refresh failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('Price refresh completed:', result.message);
    return NextResponse.json({ 
      success: true, 
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error during price refresh:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

