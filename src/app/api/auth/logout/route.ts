import { NextResponse } from 'next/server';

export async function POST() {
  // Since we're using Authorization headers, just return success
  // Token invalidation is handled client-side by removing from storage
  return NextResponse.json({ success: true });
}