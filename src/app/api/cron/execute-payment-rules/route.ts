import { NextResponse } from 'next/server';
import { executePaymentRules } from '@/app/actions';

/**
 * Cron endpoint for automated liability payment rule execution
 * Schedule: Daily at midnight to check and execute due payments
 * 
 * Security: Requires CRON_SECRET in Authorization header
 * 
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/execute-payment-rules",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 * 
 * Manual trigger:
 * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/execute-payment-rules
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
    console.log('Starting scheduled payment rule execution...');
    const result = await executePaymentRules();
    
    if (result.error) {
      console.error('Payment rule execution failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log('Payment rule execution completed:', result.message);
    return NextResponse.json({ 
      success: true, 
      message: result.message,
      paymentsExecuted: result.paymentsExecuted,
      errors: result.errors || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error during payment rule execution:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

