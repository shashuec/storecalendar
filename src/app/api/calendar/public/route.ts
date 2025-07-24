import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Get public calendar data by share token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { success: false, error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(shareToken)) {
      return NextResponse.json(
        { success: false, error: 'Invalid share token format' },
        { status: 400 }
      );
    }

    // Get public calendar data supporting both product and service businesses
    const { data: calendar, error: fetchError } = await supabase
      .from('calendar_weekly_calendars')
      .select(`
        id,
        share_token,
        is_public,
        share_title,
        share_description,
        week_number,
        start_date,
        end_date,
        country_code,
        brand_tone,
        calendar_data,
        shared_at,
        business_type,
        calendar_stores(store_name),
        calendar_service_businesses(business_name)
      `)
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Calendar not found or access denied', details: fetchError.message },
        { status: 404 }
      );
    }

    if (!calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found or not publicly accessible' },
        { status: 404 }
      );
    }

    // Get business name based on business type
    const businessName = calendar.business_type === 'service' 
      ? (calendar.calendar_service_businesses as { business_name?: string })?.business_name
      : (calendar.calendar_stores as { store_name?: string })?.store_name;

    // Return public calendar data
    return NextResponse.json({
      success: true,
      calendar: {
        shareToken: calendar.share_token,
        title: calendar.share_title,
        description: calendar.share_description,
        storeName: businessName || 'Business', // Keep field name for backward compatibility
        businessType: calendar.business_type,
        weekNumber: calendar.week_number,
        startDate: calendar.start_date,
        endDate: calendar.end_date,
        country: calendar.country_code,
        brandTone: calendar.brand_tone,
        calendarData: calendar.calendar_data,
        sharedAt: calendar.shared_at
      }
    });

  } catch (error) {
    console.error('Error fetching public calendar:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get calendar metadata for SEO (used by public calendar page)
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return new NextResponse(null, { status: 400 });
    }

    // Get basic calendar info for meta tags
    const { data: calendar, error: fetchError } = await supabase
      .from('calendar_weekly_calendars')
      .select('share_title, share_description, shared_at, business_type, calendar_stores(store_name), calendar_service_businesses(business_name)')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single();

    if (fetchError || !calendar) {
      return new NextResponse(null, { status: 404 });
    }

    // Get business name based on business type
    const businessName = calendar.business_type === 'service' 
      ? (calendar.calendar_service_businesses as { business_name?: string })?.business_name
      : (calendar.calendar_stores as { store_name?: string })?.store_name;

    // Return success with metadata in headers
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Calendar-Title': calendar.share_title || 'Weekly Social Media Calendar',
        'X-Calendar-Description': calendar.share_description || 'AI-generated content calendar',
        'X-Store-Name': businessName || 'Business',
        'X-Shared-At': calendar.shared_at || new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error fetching calendar metadata:', error);
    return new NextResponse(null, { status: 500 });
  }
}