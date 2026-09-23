import { NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST() {
  try {
    if (typeof (db as any).resetDemoData === 'function') {
      (db as any).resetDemoData();
    }
    return NextResponse.json({ success: true, message: 'Demo data restored to initial state' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
