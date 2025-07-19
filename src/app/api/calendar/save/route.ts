import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { WeeklyCalendar } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { calendar, storeName }: { calendar: WeeklyCalendar; storeName: string } = body;

    if (!calendar || !storeName) {
      return NextResponse.json(
        { error: 'Calendar data and store name are required' },
        { status: 400 }
      );
    }

    // Save calendar to database
    const { data, error } = await supabase
      .from('calendar_generations')
      .insert({
        store_url: calendar.selected_products[0]?.url || '',
        store_name: storeName,
        calendar_data: calendar,
        country: calendar.country,
        brand_tone: calendar.brand_tone,
        week_number: calendar.week_number
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving calendar:', error);
      return NextResponse.json(
        { error: 'Failed to save calendar' },
        { status: 500 }
      );
    }

    // Return share URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || 'https://storecalendar.app'
      : 'http://localhost:3000';
    
    const shareUrl = `${baseUrl}/share/${data.id}`;

    return NextResponse.json({
      success: true,
      shareId: data.id,
      shareUrl
    });

  } catch (error) {
    console.error('Error in save calendar API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}