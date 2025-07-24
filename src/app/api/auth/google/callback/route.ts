import { NextRequest, NextResponse } from 'next/server';
import { getGoogleUser } from '@/lib/google-auth';
import { generateToken } from '@/lib/jwt';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/?error=auth_denied', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // Get user info from Google
    const googleUser = await getGoogleUser(code);

    // Save or update user in database
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('calendar_users')
      .select('*')
      .eq('google_id', googleUser.id)
      .single();

    let userId: string;

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('calendar_users')
        .update({
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          updated_at: new Date().toISOString(),
        })
        .eq('google_id', googleUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.redirect(new URL('/?error=db_error', request.url));
      }

      userId = updatedUser.id;
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('calendar_users')
        .insert({
          google_id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.redirect(new URL('/?error=db_error', request.url));
      }

      userId = newUser.id;
    }

    // Generate JWT token
    const token = generateToken({
      id: userId,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });

    // Redirect to app with token as query parameter
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('token', token);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}