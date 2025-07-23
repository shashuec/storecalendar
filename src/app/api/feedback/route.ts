import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface FeedbackRequest {
  liked_website: boolean;
  improvement_suggestions?: string;
  user_id?: string | null;
  session_id?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { liked_website, improvement_suggestions, user_id, session_id } = body;

    // Validate required fields
    if (typeof liked_website !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'liked_website is required and must be boolean' },
        { status: 400 }
      );
    }

    // If user doesn't like the website, improvement suggestions should be provided
    if (!liked_website && !improvement_suggestions?.trim()) {
      return NextResponse.json(
        { success: false, error: 'improvement_suggestions is required when liked_website is false' },
        { status: 400 }
      );
    }

    // Create feedback entry
    const feedbackData = {
      liked_website,
      improvement_suggestions: improvement_suggestions?.trim() || null,
      user_id: user_id || null,
      session_id: session_id || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('calendar_feedback')
      .insert([feedbackData])
      .select()
      .single();

    if (error) {
      console.error('Database error saving feedback:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // // Log successful feedback submission
    // console.log('Feedback submitted:', {
    //   id: data.id,
    //   liked_website,
    //   has_suggestions: !!improvement_suggestions,
    //   user_type: user_id ? 'authenticated' : 'anonymous',
    //   timestamp: new Date().toISOString()
    // });

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: data.id
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback stats (for admin/analytics)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get feedback statistics
    const { data: feedbackStats, error: statsError } = await supabase
      .from('calendar_feedback')
      .select('liked_website, improvement_suggestions, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (statsError) {
      console.error('Database error fetching feedback stats:', statsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch feedback statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalFeedback = feedbackStats.length;
    const positiveFeedback = feedbackStats.filter(f => f.liked_website).length;
    const negativeFeedback = feedbackStats.filter(f => !f.liked_website).length;
    const improvementSuggestions = feedbackStats
      .filter(f => f.improvement_suggestions)
      .map(f => ({
        suggestion: f.improvement_suggestions,
        created_at: f.created_at
      }));

    const stats = {
      total_feedback: totalFeedback,
      positive_feedback: positiveFeedback,
      negative_feedback: negativeFeedback,
      satisfaction_rate: totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0,
      improvement_suggestions: improvementSuggestions,
      date_range: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days
      }
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Feedback stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}