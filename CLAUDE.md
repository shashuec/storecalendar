# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (uses Turbopack for fast builds)
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

## Project Architecture

StoreCalendar is a Next.js 15 SaaS application that generates AI-powered social media captions for Shopify products. The app uses a single-page design with progressive email collection.

### Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4, React 19
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL) with custom schema prefix `calendar_`
- **AI**: OpenAI GPT-4o for caption generation
- **Deployment**: Vercel

### Key Architecture Patterns

1. **Single-Page Application**: Main UI in `src/app/page.tsx` with conditional rendering based on state
2. **Progressive Email Collection**: Users get 3 preview captions, email required for all 7 styles + CSV export
3. **Rate Limiting**: Dual-layer protection (per-IP and global limits) in `src/lib/rate-limit.ts`
4. **Comprehensive Logging**: All OpenAI requests logged to `calendar_openai_logs` table for cost tracking

### Core Components

- `src/app/api/generate/route.ts` - Main caption generation endpoint
- `src/lib/shopify.ts` - Shopify store URL validation and product scraping
- `src/lib/openai.ts` - OpenAI integration with error handling and logging
- `src/lib/caption-styles.ts` - Defines 7 caption styles (Product Showcase, Benefits-Focused, Social Proof, etc.)
- `src/lib/supabase.ts` - Database client with TypeScript schemas

### Database Schema

All tables use `calendar_` prefix:
- `stores` - Store information and validation
- `products` - Scraped product data
- `captions` - Generated captions with metadata
- `emails` - Email collection for unlock feature
- `rate_limits` - IP-based rate limiting
- `daily_stats` - Usage analytics
- `openai_logs` - AI request tracking for cost analysis

### Environment Setup

Required environment variables (see `.env.example`):
- `OPENAI_API_KEY` & `OPENAI_MODEL` - AI configuration
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database
- `RATE_LIMIT_PER_IP` & `RATE_LIMIT_TOTAL` - Rate limiting
- `JWT_SECRET` - Token signing

### Shopify Integration

- Supports both `.myshopify.com` and custom domains
- Validates store URLs and scrapes up to 3 products
- Handles various Shopify URL formats in `src/lib/shopify.ts:extractShopifyDomain`

### Caption Generation Flow

1. User inputs Shopify store URL
2. System validates URL and scrapes products
3. Generates 3 preview captions (no email required)
4. User provides email to unlock all 7 caption styles
5. Full generation creates captions in 7 different styles
6. Results exportable as CSV

### Testing

No test framework detected. When adding tests, check existing patterns first.

### Rate Limiting Strategy

- Per-IP limits (default: 10/day) to prevent abuse
- Global limits (default: 100/day) to control costs
- Implemented in `src/lib/rate-limit.ts` with Supabase persistence