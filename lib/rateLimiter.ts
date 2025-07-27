import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Create rate limiters for different endpoints
const rateLimiters = new Map<string, RateLimiterMemory>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  '/ai-agent': {
    points: 10, // Number of requests
    duration: 60, // Per 60 seconds
  },
  '/api/users/create': {
    points: 5,
    duration: 300, // Per 5 minutes
  },
  '/api/tools/save': {
    points: 20,
    duration: 60, // Per minute
  },
  '/api/user/folders': {
    points: 10,
    duration: 60, // Per minute
  },
  default: {
    points: 100,
    duration: 60, // Per minute
  }
};

// Get or create a rate limiter for a specific endpoint
export function getRateLimiter(endpoint: string): RateLimiterMemory {
  if (!rateLimiters.has(endpoint)) {
    const config = RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG] || RATE_LIMIT_CONFIG.default;
    
    const rateLimiter = new RateLimiterMemory({
      points: config.points,
      duration: config.duration,
    });
    
    rateLimiters.set(endpoint, rateLimiter);
  }
  
  return rateLimiters.get(endpoint)!;
}

// Apply rate limiting to a request
export async function applyRateLimit(
  req: NextRequest, 
  rateLimiter: RateLimiterMemory
): Promise<NextResponse | null> {
  try {
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    await rateLimiter.consume(ip);
    return null; // No rate limit exceeded
  } catch (rejRes: any) {
    // Rate limit exceeded
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${secs} seconds.`,
        retryAfter: secs
      },
      {
        status: 429,
        headers: {
          'Retry-After': secs.toString(),
          'X-RateLimit-Limit': rateLimiter.points.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString()
        }
      }
    );
  }
}

// Get rate limit info for an endpoint
export function getRateLimitInfo(endpoint: string) {
  const config = RATE_LIMIT_CONFIG[endpoint as keyof typeof RATE_LIMIT_CONFIG] || RATE_LIMIT_CONFIG.default;
  return {
    limit: config.points,
    window: config.duration,
    windowUnit: 'seconds'
  };
} 