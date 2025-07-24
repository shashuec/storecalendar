import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthenticatedUser, createAuthError } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        createAuthError('Authentication required'),
        { status: 401 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch user's previous calendars with store and service business information
    const { data: calendars, error, count } = await supabase
      .from('calendar_weekly_calendars')
      .select(`
        id,
        week_number,
        start_date,
        end_date,
        country_code,
        brand_tone,
        selected_products,
        created_at,
        is_public,
        share_token,
        share_title,
        share_description,
        shared_at,
        business_type,
        calendar_stores(
          id,
          store_name,
          shopify_url
        ),
        calendar_service_businesses(
          id,
          business_name,
          business_url,
          category
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Calendar history fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch calendar history' },
        { status: 500 }
      );
    }

    // Transform the data to include public links
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const transformedCalendars = calendars?.map(calendar => {
      const isServiceBusiness = calendar.business_type === 'service';
      const businessName = isServiceBusiness 
        ? (calendar.calendar_service_businesses as { business_name?: string })?.business_name
        : (calendar.calendar_stores as { store_name?: string })?.store_name;
      const businessUrl = isServiceBusiness
        ? (calendar.calendar_service_businesses as { business_url?: string })?.business_url
        : (calendar.calendar_stores as { shopify_url?: string })?.shopify_url;
      
      return {
        id: calendar.id,
        businessType: calendar.business_type || 'product',
        storeName: businessName, // Keep same field name for backward compatibility
        storeUrl: businessUrl,   // Keep same field name for backward compatibility
        weekNumber: calendar.week_number,
        startDate: calendar.start_date,
        endDate: calendar.end_date,
        country: calendar.country_code,
        brandTone: calendar.brand_tone,
        productCount: Array.isArray(calendar.selected_products) ? calendar.selected_products.length : 0,
        serviceCategory: isServiceBusiness 
          ? (calendar.calendar_service_businesses as { category?: string })?.category 
          : null,
        createdAt: calendar.created_at,
        isPublic: calendar.is_public,
        shareToken: calendar.share_token,
        shareTitle: calendar.share_title,
        shareDescription: calendar.share_description,
        sharedAt: calendar.shared_at,
        publicUrl: calendar.is_public && calendar.share_token 
          ? `${baseUrl}/${calendar.share_token}`
          : null
      };
    }) || [];

    // Return the calendars with pagination info
    return NextResponse.json({
      success: true,
      calendars: transformedCalendars,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Calendar history API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}