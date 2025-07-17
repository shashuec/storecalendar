import { supabase } from './supabase';

export async function checkRateLimit(ipAddress: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime?: Date;
}> {
  try {
    const perIpLimit = parseInt(process.env.RATE_LIMIT_PER_IP || '10');
    
    // Check IP-specific rate limit
    const { data: ipData, error: ipError } = await supabase
      .from('calendar_rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .single();
    
    if (ipError && ipError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Rate limit check error:', ipError);
      return { allowed: true, remaining: perIpLimit }; // Allow on error
    }
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    if (ipData) {
      const lastRequest = new Date(ipData.last_request);
      
      // Reset if more than an hour has passed
      if (lastRequest < oneHourAgo) {
        await supabase
          .from('calendar_rate_limits')
          .update({
            request_count: 1,
            last_request: now.toISOString()
          })
          .eq('ip_address', ipAddress);
        
        return { allowed: true, remaining: perIpLimit - 1 };
      }
      
      // Check if IP has exceeded limit
      if (ipData.request_count >= perIpLimit) {
        const resetTime = new Date(lastRequest.getTime() + 60 * 60 * 1000);
        return { 
          allowed: false, 
          remaining: 0,
          resetTime
        };
      }
      
      // Increment counter
      await supabase
        .from('calendar_rate_limits')
        .update({
          request_count: ipData.request_count + 1,
          last_request: now.toISOString()
        })
        .eq('ip_address', ipAddress);
      
      return { 
        allowed: true, 
        remaining: perIpLimit - (ipData.request_count + 1) 
      };
    } else {
      // First request from this IP
      await supabase
        .from('calendar_rate_limits')
        .insert({
          ip_address: ipAddress,
          request_count: 1,
          last_request: now.toISOString(),
          daily_limit: perIpLimit
        });
      
      return { allowed: true, remaining: perIpLimit - 1 };
    }
    
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: 0 }; // Allow on error
  }
}

export async function checkGlobalRateLimit(): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime?: Date;
}> {
  try {
    const totalLimit = parseInt(process.env.RATE_LIMIT_TOTAL || '100');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: statsData, error: statsError } = await supabase
      .from('calendar_daily_stats')
      .select('*')
      .eq('date', today)
      .single();
    
    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Global rate limit check error:', statsError);
      return { allowed: true, remaining: totalLimit };
    }
    
    const now = new Date();
    
    if (statsData) {
      const lastReset = new Date(statsData.last_reset);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Reset if more than an hour has passed
      if (lastReset < oneHourAgo) {
        await supabase
          .from('calendar_daily_stats')
          .update({
            total_requests: 1,
            last_reset: now.toISOString()
          })
          .eq('date', today);
        
        return { allowed: true, remaining: totalLimit - 1 };
      }
      
      // Check global limit
      if (statsData.total_requests >= totalLimit) {
        const resetTime = new Date(lastReset.getTime() + 60 * 60 * 1000);
        return { 
          allowed: false, 
          remaining: 0,
          resetTime
        };
      }
      
      // Increment global counter
      await supabase
        .from('calendar_daily_stats')
        .update({
          total_requests: statsData.total_requests + 1,
          last_reset: now.toISOString()
        })
        .eq('date', today);
      
      return { 
        allowed: true, 
        remaining: totalLimit - (statsData.total_requests + 1) 
      };
    } else {
      // First request today
      await supabase
        .from('calendar_daily_stats')
        .insert({
          date: today,
          total_requests: 1,
          last_reset: now.toISOString()
        });
      
      return { allowed: true, remaining: totalLimit - 1 };
    }
    
  } catch (error) {
    console.error('Global rate limit check failed:', error);
    return { allowed: true, remaining: 0 };
  }
}

export function getClientIP(request: Request): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfIP) {
    return cfIP;
  }
  
  return 'unknown';
}