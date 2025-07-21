import { NextRequest } from 'next/server';
import { verifyToken, UserPayload, getTokenFromHeaders } from './jwt';

export async function getAuthenticatedUser(request: NextRequest): Promise<UserPayload | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeaders(authHeader);
    
    if (!token) {
      return null;
    }

    const user = verifyToken(token);
    return user;
  } catch (error) {
    console.error('Error verifying user token:', error);
    return null;
  }
}

export function createAuthError(message: string = 'Authentication required') {
  return {
    success: false,
    error: message,
    requiresAuth: true
  };
}