import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, createAuthError } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        createAuthError('Authentication required'),
        { status: 401 }
      );
    }

    const { id: calendarId } = await params;

    // Fetch the calendar with all related data
    const { data: calendar, error: calendarError } = await supabase
      .from('calendar_weekly_calendars')
      .select(`
        *,
        calendar_stores(
          id,
          store_name,
          shopify_url
        ),
        calendar_service_businesses(
          id,
          business_name,
          business_url,
          category,
          services
        ),
        calendar_posts(
          *
        )
      `)
      .eq('id', calendarId)
      .eq('user_id', user.id)
      .single();

    if (calendarError) {
      console.error('Calendar fetch error:', calendarError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch calendar' },
        { status: 500 }
      );
    }

    if (!calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected format
    const isServiceBusiness = calendar.business_type === 'service';
    const businessName = isServiceBusiness 
      ? calendar.calendar_service_businesses?.business_name
      : calendar.calendar_stores?.store_name;
    const businessUrl = isServiceBusiness
      ? calendar.calendar_service_businesses?.business_url
      : calendar.calendar_stores?.shopify_url;

    // Map and sort posts by date
    const sortedPosts = calendar.calendar_posts?.map((post: { id: string; day_name?: string; day?: string; post_date?: string; date?: string; post_type?: string; caption_text?: string; product_featured?: Record<string, unknown>; holiday_context?: Record<string, unknown> }) => ({
      id: post.id,
      day: post.day_name || post.day || '', // Handle different column names
      date: post.post_date || post.date || '',
      post_type: post.post_type || '',
      caption_text: post.caption_text || '',
      product_featured: post.product_featured || null,
      holiday_context: post.holiday_context || null
    })).sort((a: { date: string }, b: { date: string }) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ) || [];

    // Build the weekly calendar structure
    const weeklyCalendar = {
      week_number: calendar.week_number,
      start_date: calendar.start_date,
      end_date: calendar.end_date,
      posts: sortedPosts,
      country: calendar.country_code,
      brand_tone: calendar.brand_tone,
      selected_products: calendar.selected_products || []
    };

    // Build enhanced products if it's a product business
    let enhancedProducts = [];
    if (!isServiceBusiness && calendar.selected_products) {
      // Fetch product details if needed
      const { data: products } = await supabase
        .from('calendar_products')
        .select('*')
        .in('shopify_product_id', calendar.selected_products)
        .eq('store_id', calendar.store_id);
      
      enhancedProducts = products || [];
    }

    return NextResponse.json({
      success: true,
      calendar: {
        id: calendar.id,
        businessType: calendar.business_type || 'product',
        storeName: businessName,
        storeUrl: businessUrl,
        weekNumber: calendar.week_number,
        weeklyCalendar,
        enhancedProducts,
        serviceCategory: isServiceBusiness 
          ? calendar.calendar_service_businesses?.category 
          : null,
        services: isServiceBusiness
          ? calendar.calendar_service_businesses?.services || []
          : []
      }
    });

  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}