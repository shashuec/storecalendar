import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createAuthError } from '@/lib/auth-middleware';
import { supabase } from '@/lib/supabase';

// Share a calendar - make it publicly accessible
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        createAuthError('Please sign in to share calendars'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      calendarId, 
      title = 'Weekly Social Media Calendar',
      description = 'AI-generated social media content calendar'
    } = body;

    if (!calendarId) {
      return NextResponse.json(
        { success: false, error: 'Calendar ID is required' },
        { status: 400 }
      );
    }

    // Verify the calendar belongs to the authenticated user
    const { data: calendar, error: fetchError } = await supabase
      .from('calendar_weekly_calendars')
      .select('id, user_id, is_public, share_token')
      .eq('id', calendarId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found or access denied' },
        { status: 404 }
      );
    }

    // If already public, return existing share info
    if (calendar.is_public) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const publicUrl = `${baseUrl}/${calendar.share_token}`;
      
      return NextResponse.json({
        success: true,
        shareToken: calendar.share_token,
        publicUrl: publicUrl,
        message: 'Calendar is already public'
      });
    }

    // Make calendar public using database function
    const { data: shareResult, error: shareError } = await supabase
      .rpc('make_calendar_public', {
        calendar_id: calendarId,
        title,
        description
      });

    if (shareError) {
      console.error('Error making calendar public:', shareError);
      return NextResponse.json(
        { success: false, error: 'Failed to share calendar' },
        { status: 500 }
      );
    }

    const shareToken = shareResult[0].share_token;
    
    // Construct public URL from environment variables
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const publicUrl = `${baseUrl}/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      publicUrl,
      message: 'Calendar shared successfully'
    });

  } catch (error) {
    console.error('Error in calendar share:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Revoke public access to a calendar
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        createAuthError('Please sign in to manage calendar sharing'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId');

    if (!calendarId) {
      return NextResponse.json(
        { success: false, error: 'Calendar ID is required' },
        { status: 400 }
      );
    }

    // Verify the calendar belongs to the authenticated user
    const { data: calendar, error: fetchError } = await supabase
      .from('calendar_weekly_calendars')
      .select('id, user_id, is_public')
      .eq('id', calendarId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found or access denied' },
        { status: 404 }
      );
    }

    // If not public, nothing to revoke
    if (!calendar.is_public) {
      return NextResponse.json({
        success: true,
        message: 'Calendar is not currently public'
      });
    }

    // Revoke public access using database function
    const { data: _revokeResult, error: revokeError } = await supabase
      .rpc('revoke_public_access', {
        calendar_id: calendarId
      });

    if (revokeError) {
      console.error('Error revoking calendar access:', revokeError);
      return NextResponse.json(
        { success: false, error: 'Failed to revoke calendar access' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar access revoked successfully'
    });

  } catch (error) {
    console.error('Error in calendar unshare:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}