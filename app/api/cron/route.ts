import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized', message: 'Invalid or missing CRON_SECRET authorization' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return NextResponse.json({
    ok: true,
    message: 'Cron job executed successfully',
    timestamp: new Date().toISOString()
  });
}
