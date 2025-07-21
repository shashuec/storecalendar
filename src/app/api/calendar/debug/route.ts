import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to check calendar sharing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');
    
    if (!shareToken) {
      // List all public calendars
      const { data: calendars, error } = await supabase
        .from('calendar_weekly_calendars')
        .select('id, share_token, is_public, share_title, user_id, created_at')
        .eq('is_public', true)
        .limit(10);
        
      return NextResponse.json({
        success: true,
        publicCalendars: calendars || [],
        error: error?.message
      });
    }
    
    // Check specific calendar by share token
    const { data: calendar, error } = await supabase
      .from('calendar_weekly_calendars')
      .select('*')
      .eq('share_token', shareToken)
      .single();
      
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    
    return NextResponse.json({
      success: true,
      calendar: {
        id: calendar?.id,
        shareToken: calendar?.share_token,
        isPublic: calendar?.is_public,
        shareTitle: calendar?.share_title,
        shareDescription: calendar?.share_description,
        sharedAt: calendar?.shared_at,
        userId: calendar?.user_id,
        hasCalendarData: !!calendar?.calendar_data
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}