import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Calendar ID is required' },
        { status: 400 }
      );
    }

    // Fetch calendar from database
    const { data, error } = await supabase
      .from('calendar_generations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching calendar:', error);
      return NextResponse.json(
        { error: 'Calendar not found or expired' },
        { status: 404 }
      );
    }

    // Check if calendar has expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Calendar has expired' },
        { status: 410 }
      );
    }

    // Increment view count
    await supabase.rpc('increment_calendar_view_count', {
      calendar_id: id
    });

    return NextResponse.json({
      success: true,
      calendar: data.calendar_data,
      storeName: data.store_name,
      createdAt: data.created_at,
      viewCount: data.view_count + 1
    });

  } catch (error) {
    console.error('Error in get calendar API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}