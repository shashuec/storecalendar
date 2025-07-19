# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoreCalendar is a Next.js 15 SaaS application that generates AI-powered social media content for e-commerce stores. The platform transforms from simple caption generation to comprehensive Content-to-Commerce Intelligence with sales attribution.

**Current Status**: V1 launched (text-only captions for Shopify)  
**In Development**: Multi-format content (images, videos) + multi-platform support (WooCommerce, Magento, BigCommerce)

## Development Commands

- `npm run dev` - Start development server (uses Turbopack for fast builds)
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint checks

## Project Architecture

StoreCalendar is evolving from a Shopify-specific caption generator to a universal e-commerce content intelligence platform. The app uses a single-page design with progressive feature unlocking.

### Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4, React 19
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL) with custom schema prefix `calendar_`
- **AI Services**: 
  - OpenAI GPT-4o for caption generation
  - DALL-E 3 for image generation (planned)
  - RunwayML/Pika Labs for video generation (planned)
- **Deployment**: Vercel
- **E-commerce Integrations**: 
  - Shopify (REST API + Webhooks)
  - WooCommerce (REST API + WordPress hooks) - planned
  - Magento (GraphQL API) - planned
  - BigCommerce (REST API) - planned

### Key Architecture Patterns

1. **Multi-Step UX Flow**: Progressive disclosure from URL input → product selection → preferences → results
2. **Shareable Results**: Generated calendars saved with unique URLs for team collaboration (30-day expiry)
3. **Multi-Format Content Generation**: Text, images, and videos from single product input
4. **Sales Attribution**: UTM tracking + webhook integration for revenue attribution
5. **Rate Limiting**: Dual-layer protection (per-IP and global limits) in `src/lib/rate-limit.ts`
6. **Comprehensive Logging**: All AI requests logged to `calendar_openai_logs` table for cost tracking
7. **Platform-Agnostic Design**: Universal integration layer for all e-commerce platforms

### Core Components

#### **Current (V1)**
- `src/app/api/generate/route.ts` - Main content generation endpoint
- `src/app/api/calendar/save/route.ts` - Save calendar for sharing
- `src/app/api/calendar/[id]/route.ts` - Retrieve shared calendars
- `src/app/share/[id]/page.tsx` - Shared calendar viewing page
- `src/app/page.tsx` - Multi-step UI flow with progressive disclosure
- `src/lib/shopify.ts` - Shopify store URL validation and product scraping
- `src/lib/openai.ts` - OpenAI integration with error handling and logging
- `src/lib/caption-styles.ts` - Defines 7 caption styles (Product Showcase, Benefits-Focused, Social Proof, etc.)
- `src/lib/calendar-generation.ts` - Calendar generation and CSV export functionality
- `src/lib/supabase.ts` - Database client with TypeScript schemas
- `src/components/WeeklyCalendar.tsx` - Calendar display with copy, export, and share functionality
- `src/components/ProductSelector.tsx` - Product selection with smart ranking

#### **Planned (V2)**
- `src/lib/image-generation.ts` - DALL-E 3 integration for visual content
- `src/lib/video-generation.ts` - Video creation with RunwayML/Pika Labs
- `src/lib/sales-attribution.ts` - UTM tracking and revenue attribution
- `src/lib/platform-connectors/` - Universal e-commerce platform integrations
- `src/lib/performance-analytics.ts` - Content performance tracking and optimization

### Database Schema

All tables use `calendar_` prefix:

#### **Current Tables (V1)**
- `calendar_stores` - Store information and validation
- `calendar_products` - Scraped product data
- `calendar_captions` - Generated captions with metadata
- `calendar_emails` - Email collection for unlock feature
- `calendar_rate_limits` - IP-based rate limiting
- `calendar_daily_stats` - Usage analytics
- `calendar_openai_logs` - AI request tracking for cost analysis
- `calendar_generations` - Shareable calendar storage (30-day expiry)

#### **Planned Tables (V2)**
- `calendar_visual_content` - Generated images and videos
- `calendar_performance_metrics` - Content performance tracking
- `calendar_sales_attribution` - Revenue attribution data
- `calendar_platform_connections` - Multi-platform store connections
- `calendar_user_accounts` - User management and subscriptions

### Environment Setup

Required environment variables (see `.env.example`):

#### **Current (V1)**
- `NEXT_PUBLIC_APP_URL` - Base URL for share links
- `OPENAI_API_KEY` & `OPENAI_MODEL` - AI configuration
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database
- `RATE_LIMIT_PER_IP` & `RATE_LIMIT_TOTAL` - Rate limiting
- `JWT_SECRET` - Token signing

#### **Planned (V2)**
- `DALLE_API_KEY` - DALL-E 3 image generation
- `RUNWAYML_API_KEY` - Video generation
- `SHOPIFY_WEBHOOK_SECRET` - Shopify webhook verification
- `WOOCOMMERCE_API_KEY` - WooCommerce integration
- `MAGENTO_API_KEY` - Magento integration
- `BIGCOMMERCE_API_KEY` - BigCommerce integration

### E-commerce Platform Integration

#### **Current: Shopify**
- Supports both `.myshopify.com` and custom domains
- Validates store URLs and scrapes up to 3 products
- Handles various URL formats in `src/lib/shopify.ts:extractShopifyDomain`

#### **Planned: Multi-Platform**
- **WooCommerce**: WordPress plugin + REST API integration
- **Magento**: Extension + GraphQL API integration
- **BigCommerce**: App marketplace + REST API integration
- **Universal**: Platform-agnostic content generation

### Content Generation Flow

#### **Current (V1)**
1. User inputs store URL
2. System validates URL and scrapes products
3. User selects products and preferences (country, brand tone)
4. Generates 7-day weekly calendar with strategic post types
5. Results exportable as CSV

#### **Planned (V2)**
1. Multi-platform store connection
2. Content type selection (text, images, videos)
3. AI-powered content generation with brand consistency
4. Performance tracking and optimization
5. Sales attribution and ROI measurement

## API Documentation

### Current Endpoints

#### **POST /api/generate**
Main content generation endpoint
- **Body**: `{ shopify_url, country, brand_tone, selected_products, week_number }`
- **Response**: `{ success, weekly_calendar, enhanced_products, error }`

#### **POST /api/calendar/save**
Save calendar for sharing
- **Body**: `{ calendar, storeName }`
- **Response**: `{ success, shareId, shareUrl, error }`

#### **GET /api/calendar/[id]**
Retrieve shared calendar by ID
- **Response**: `{ success, calendar, storeName, createdAt, viewCount, error }`

### Planned Endpoints (V2)

#### **POST /api/generate/visual**
Visual content generation
- **Body**: `{ product_data, content_type, brand_guidelines }`
- **Response**: `{ success, visual_content, error }`

#### **POST /api/analytics/track**
Performance tracking
- **Body**: `{ post_id, platform, metrics }`
- **Response**: `{ success, attribution_data, error }`

#### **GET /api/analytics/dashboard/:storeId**
Performance dashboard data
- **Response**: `{ success, analytics, recommendations, error }`

## Code Patterns

### Development Standards
- **TypeScript**: All code must be typed
- **Error Handling**: Use try/catch with proper error messages
- **Logging**: Log all AI requests for cost tracking
- **Rate Limiting**: Implement for all external API calls
- **Component Structure**: Follow existing patterns in `src/components/`

### File Organization
- **API Routes**: `src/app/api/[endpoint]/route.ts`
- **Library Functions**: `src/lib/[feature].ts`
- **Components**: `src/components/[ComponentName].tsx`
- **Types**: `src/types/index.ts`

## Testing

Currently no test framework. When adding tests:
- Use existing patterns from similar Next.js projects
- Test API endpoints thoroughly
- Mock external API calls (OpenAI, Shopify, etc.)
- Test rate limiting and error handling

## Rate Limiting Strategy

- Per-IP limits (default: 10/day) to prevent abuse
- Global limits (default: 100/day) to control costs
- Implemented in `src/lib/rate-limit.ts` with Supabase persistence

## Development Workflow

1. **Feature Development**: Create feature branch from main
2. **Code Standards**: Follow TypeScript and existing patterns
3. **Testing**: Test locally with real API calls
4. **Rate Limiting**: Ensure all external calls are rate limited
5. **Documentation**: Update CLAUDE.md for significant changes