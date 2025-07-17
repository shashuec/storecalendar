# StoreCalendar

Turn your Shopify products into social media gold with AI-generated captions.

## Features

- **Shopify Integration**: Paste any Shopify store URL to get started
- **7 Caption Styles**: Product showcase, benefits-focused, social proof, how-to-style, problem/solution, behind-the-scenes, call-to-action
- **Progressive Email Collection**: Preview 3 captions, then unlock all 7 with email
- **Customizable Generation**: Select which caption styles you want
- **CSV Export**: Download all captions for easy scheduling
- **Rate Limiting**: Built-in protection with configurable limits

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations in Supabase
5. Start development server: `npm run dev`

## Environment Variables

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RATE_LIMIT_PER_IP=10
RATE_LIMIT_TOTAL=100
JWT_SECRET=your_jwt_secret
```

## Database Setup

Create these tables in your Supabase dashboard:

- `calendar_stores` - Store information
- `calendar_products` - Product data
- `calendar_captions` - Generated captions
- `calendar_rate_limits` - Rate limiting
- `calendar_daily_stats` - Usage statistics
- `calendar_emails` - Email collection

See `src/lib/supabase.ts` for complete schema.

## API Endpoints

- `POST /api/generate` - Generate captions for Shopify store

## License

MIT
