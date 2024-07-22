import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: NextRequest) {
  try {
    const lastUpdateTime = await kv.get('last_update_time');
    return NextResponse.json({ lastUpdateTime });
  } catch (error) {
    console.error('Error fetching last update time:', error);
    return NextResponse.json({ error: 'Failed to fetch last update time' }, { status: 500 });
  }
}