import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createAuthError } from '@/lib/auth-middleware';
import { checkRateLimit, checkGlobalRateLimit, getClientIP } from '@/lib/rate-limit';
import { ServiceBusiness, CalendarPost } from '@/types';
import { generateServiceContent } from '@/lib/service-content-generation';
import { getUpcomingHolidays } from '@/lib/holidays';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        createAuthError('Please sign in to continue'),
        { status: 401 }
      );
    }

    // Check rate limits
    const clientIP = getClientIP(request);
    const [ipRateLimit, globalRateLimit] = await Promise.all([
      checkRateLimit(clientIP),
      checkGlobalRateLimit()
    ]);

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil((ipRateLimit.resetTime!.getTime() - Date.now()) / 60000)} minutes.`,
          resetTime: ipRateLimit.resetTime
        },
        { status: 429 }
      );
    }

    if (!globalRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'System busy. Please try again later.',
          resetTime: globalRateLimit.resetTime
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const serviceBusiness: ServiceBusiness = body.serviceBusiness;
    const weekNumber: 1 | 2 = body.weekNumber || 1;

    // Validate input
    if (!serviceBusiness || !serviceBusiness.businessName || !serviceBusiness.category) {
      return NextResponse.json(
        { success: false, error: 'Service business information is required' },
        { status: 400 }
      );
    }

    if (!serviceBusiness.services || serviceBusiness.services.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one service must be selected' },
        { status: 400 }
      );
    }

    if (!serviceBusiness.contentGoals || serviceBusiness.contentGoals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one content goal must be selected' },
        { status: 400 }
      );
    }

    // Get holidays for the specified week
    const holidays = getUpcomingHolidays('US', 14); // Default to US for now

    // Store or update service business in database
    let serviceBusinessId: string;
    
    try {
      // Check if business already exists
      const businessUrl = serviceBusiness.businessUrl || serviceBusiness.website || '';
      const { data: existingBusiness } = await supabase
        .from('calendar_service_businesses')
        .select('id')
        .eq('business_url', businessUrl)
        .single();
      
      if (existingBusiness) {
        // Update existing business
        const { data: updatedBusiness, error: updateError } = await supabase
          .from('calendar_service_businesses')
          .update({
            business_name: serviceBusiness.businessName,
            location: serviceBusiness.location || null,
            category: serviceBusiness.category,
            services: serviceBusiness.services || [],
            target_audience: serviceBusiness.targetAudience ? JSON.stringify(serviceBusiness.targetAudience) : null,
            scraped_content: serviceBusiness.scrapedContent || null,
            last_scraped: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBusiness.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        serviceBusinessId = updatedBusiness.id;
      } else {
        // Create new business
        const { data: newBusiness, error: insertError } = await supabase
          .from('calendar_service_businesses')
          .insert({
            business_name: serviceBusiness.businessName,
            business_url: businessUrl,
            location: serviceBusiness.location || null,
            category: serviceBusiness.category,
            services: serviceBusiness.services || [],
            target_audience: serviceBusiness.targetAudience ? JSON.stringify(serviceBusiness.targetAudience) : null,
            scraped_content: serviceBusiness.scrapedContent || null
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        serviceBusinessId = newBusiness.id;
      }
    } catch (dbError) {
      console.error('Database error for service business:', dbError);
      // Continue anyway - we can still generate the calendar
      serviceBusinessId = `temp-${Date.now()}`;
    }

    // Generate weekly calendar for service business
    const weeklyCalendar = await generateServiceContent(
      serviceBusiness,
      weekNumber,
      holidays
    );

    if (!weeklyCalendar) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate content calendar' },
        { status: 500 }
      );
    }

    // Store the weekly calendar in database
    let calendarId = null;
    try {
      const { data: calendarData, error: calendarError } = await supabase
        .from('calendar_weekly_calendars')
        .insert({
          user_id: user.id,
          service_business_id: serviceBusinessId.startsWith('temp-') ? null : serviceBusinessId,
          business_type: 'service',
          week_number: weekNumber,
          start_date: weeklyCalendar.start_date,
          end_date: weeklyCalendar.end_date,
          country_code: 'US', // Default for now
          brand_tone: serviceBusiness.brandTone || serviceBusiness.brandVoice || 'casual',
          selected_products: null, // Not applicable for service businesses
          calendar_data: weeklyCalendar,
          is_public: true, // Make public by default
          // share_token will be auto-generated by database using gen_random_uuid()
          share_title: `${serviceBusiness.businessName} - Week ${weekNumber} Social Calendar`,
          share_description: 'AI-generated social media content calendar',
          shared_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (calendarError) {
        console.error('Calendar storage error:', calendarError);
      } else if (calendarData) {
        calendarId = calendarData.id;
        // Store the share token for later use
        weeklyCalendar.share_token = calendarData.share_token;
        
        // Store individual posts
        const postsToInsert = weeklyCalendar.posts.map((post: CalendarPost) => ({
          calendar_id: calendarData.id,
          store_id: null, // Not applicable for service businesses
          service_business_id: serviceBusinessId.startsWith('temp-') ? null : serviceBusinessId,
          day_name: post.day,
          post_date: post.date,
          post_type: post.post_type,
          caption_text: post.caption_text,
          service_featured: post.service_featured || null,
          holiday_context: post.holiday_context || null
        }));
        
        await supabase
          .from('calendar_posts')
          .insert(postsToInsert);
        
        // Store service captions for reuse
        if (!serviceBusinessId.startsWith('temp-')) {
          const captionsToInsert = weeklyCalendar.posts.map((post: CalendarPost) => ({
            service_business_id: serviceBusinessId,
            caption_text: post.caption_text,
            caption_style: post.post_type,
            service_featured: post.service_featured || null
          }));
          
          await supabase
            .from('calendar_service_captions')
            .insert(captionsToInsert);
        }
      }
    } catch (error) {
      console.error('Calendar persistence error:', error);
      // Continue anyway - don't fail the request
    }

    // Return the generated calendar
    return NextResponse.json({
      success: true,
      business_name: serviceBusiness.businessName,
      weekly_calendar: weeklyCalendar,
      upcoming_holidays: holidays,
      calendar_id: calendarId,
      share_token: weeklyCalendar.share_token || null,
      message: 'Service business calendar generated successfully'
    });

  } catch (error) {
    console.error('Service generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}