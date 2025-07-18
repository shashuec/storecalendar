# StoreCalendar V1 API Documentation

## Overview

StoreCalendar V1 provides a single, powerful API endpoint that transforms Shopify stores into holiday-aware weekly social media calendars. The API is designed API-first with comprehensive parameter validation and rich response data.

## Base URL
```
Production: https://your-domain.com
Development: http://localhost:3000
```

## Authentication
Currently no authentication required (free tier). Rate limiting is implemented per IP and globally.

---

## Primary Endpoint

### `POST /api/generate`

Generates holiday-aware social media content calendars for Shopify stores.

#### Request Body

```typescript
{
  // Required
  shopify_url: string;           // Shopify store URL
  
  // V1 Optional Parameters
  country?: 'US' | 'UK' | 'IN';  // Country for holiday context
  selected_products?: string[];   // Array of product IDs (3-10)
  brand_tone?: 'professional' | 'casual' | 'playful' | 'luxury';
  week_number?: 1 | 2;           // Week 1 (product focus) or 2 (lifestyle focus)
  
  // Legacy Parameters (backward compatibility)
  email?: string;                // For email collection
  selected_styles?: string[];    // Legacy caption styles
  force_refresh?: boolean;       // Force fresh product scraping
}
```

#### Response Structure

```typescript
{
  success: boolean;
  store_name?: string;
  
  // V1 Response Data
  weekly_calendar?: WeeklyCalendar;        // Complete 7-day calendar
  enhanced_products?: ShopifyProductEnhanced[]; // All products with ranking
  upcoming_holidays?: Holiday[];           // Next 14 days of holidays
  
  // Legacy Response Data
  products?: ShopifyProduct[];             // Selected products
  all_captions?: Caption[];               // Generated captions
  preview_captions?: Caption[];           // First 3 captions
  
  // Metadata
  requires_email?: boolean;
  email_stored?: boolean;
  message?: string;
  error?: string;
}
```

---

## Data Models

### WeeklyCalendar
```typescript
{
  week_number: 1 | 2;
  start_date: string;        // YYYY-MM-DD
  end_date: string;          // YYYY-MM-DD
  posts: CalendarPost[];     // 7 posts, one per day
  country: CountryCode;
  brand_tone: BrandTone;
  selected_products: ShopifyProduct[];
}
```

### CalendarPost
```typescript
{
  id: string;
  day: string;               // "Monday", "Tuesday", etc.
  date: string;              // YYYY-MM-DD
  post_type: string;         // "Product Showcase", "Testimonial", etc.
  caption_text: string;      // Generated caption
  product_featured: ShopifyProduct;
  holiday_context?: Holiday; // If relevant holiday
}
```

### ShopifyProductEnhanced
```typescript
{
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  // Enhanced fields
  selected?: boolean;
  rank?: number;             // Bestseller ranking
  product_type?: string;
  vendor?: string;
  tags?: string[];
}
```

### Holiday
```typescript
{
  date: string;              // YYYY-MM-DD
  name: string;
  type: 'celebration' | 'gift-giving' | 'shopping' | 'patriotic' | 
        'festival' | 'seasonal' | 'environmental';
}
```

---

## API Usage Examples

### 1. Basic Product Loading (V0 Legacy)

**Request:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "shopify_url": "thedrugstorecompany.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "store_name": "The Drug Store Company",
  "enhanced_products": [
    {
      "id": "123456789",
      "name": "Premium Face Cream",
      "description": "Advanced anti-aging formula...",
      "price": "49.99",
      "image_url": "https://...",
      "selected": false,
      "rank": 1,
      "product_type": "Skincare",
      "vendor": "Beauty Co",
      "tags": ["anti-aging", "premium"]
    }
  ],
  "requires_email": true
}
```

### 2. V1 Complete Calendar Generation

**Request:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "shopify_url": "thedrugstorecompany.com",
    "country": "US",
    "selected_products": ["123456789", "987654321", "456789123"],
    "brand_tone": "casual",
    "week_number": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "store_name": "The Drug Store Company",
  "weekly_calendar": {
    "week_number": 1,
    "start_date": "2025-01-20",
    "end_date": "2025-01-26",
    "country": "US",
    "brand_tone": "casual",
    "posts": [
      {
        "id": "2025-01-20-123456789",
        "day": "Monday",
        "date": "2025-01-20",
        "post_type": "Product Showcase",
        "caption_text": "Martin Luther King Jr. Day vibes! ✨ Our Premium Face Cream is perfect for starting the week with self-care. Smooth, hydrated skin that feels amazing! 💆‍♀️ #SelfCare #MLKDay #Skincare",
        "product_featured": {
          "id": "123456789",
          "name": "Premium Face Cream",
          "price": "49.99"
        },
        "holiday_context": {
          "date": "2025-01-20",
          "name": "Martin Luther King Jr. Day",
          "type": "patriotic"
        }
      }
      // ... 6 more posts
    ]
  },
  "upcoming_holidays": [
    {
      "date": "2025-01-20",
      "name": "Martin Luther King Jr. Day",
      "type": "patriotic"
    },
    {
      "date": "2025-02-14",
      "name": "Valentine's Day",
      "type": "gift-giving"
    }
  ],
  "enhanced_products": [...],
  "requires_email": true
}
```

### 3. Country-Specific Holiday Integration

**Request:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "shopify_url": "thedrugstorecompany.com",
    "country": "IN"
  }'
```

**Response includes Indian holidays:**
```json
{
  "upcoming_holidays": [
    {
      "date": "2025-01-26",
      "name": "Republic Day",
      "type": "patriotic"
    },
    {
      "date": "2025-03-14",
      "name": "Holi",
      "type": "festival"
    }
  ]
}
```

### 4. Brand Tone Variations

**Professional Tone:**
```json
{
  "brand_tone": "professional",
  "caption_text": "Elevate your skincare routine with our clinically-proven Premium Face Cream. Trusted by professionals for superior anti-aging results. ✨ #PremiumSkincare #Professional"
}
```

**Playful Tone:**
```json
{
  "brand_tone": "playful",
  "caption_text": "Glow up time! 🌟 This little magic bottle is about to become your skin's new BFF! Who's ready to sparkle? ✨💫 #GlowUp #SkincareAddict"
}
```

### 5. Week 2 Generation (Lifestyle Focus)

**Request:**
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "shopify_url": "thedrugstorecompany.com",
    "country": "US",
    "brand_tone": "casual",
    "week_number": 2
  }'
```

**Week 2 posts focus on lifestyle and usage scenarios rather than product features.**

---

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Invalid country code. Must be US, UK, or IN"
}
```

### Rate Limiting (429)
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 45 minutes.",
  "resetTime": "2025-01-20T15:30:00Z"
}
```

### Store Errors (400)
```json
{
  "success": false,
  "error": "This store is password protected or private. Please make it public temporarily."
}
```

### Generation Errors (500)
```json
{
  "success": false,
  "error": "Failed to generate captions. Please try again or contact support if the issue persists."
}
```

---

## Rate Limits

- **Per IP**: 10 requests per day (default)
- **Global**: 100 requests per day (default)
- Rate limits reset at midnight UTC
- Headers include reset time for client-side handling

---

## Holiday Coverage

### United States (37 holidays)
Major holidays, observances, and shopping events including:
- Federal holidays (New Year's, MLK Day, Presidents Day, etc.)
- Cultural events (Valentine's Day, Halloween, etc.)
- Shopping events (Black Friday, Cyber Monday, etc.)
- Seasonal events (Spring Equinox, Summer Solstice, etc.)

### United Kingdom (32 holidays)
Bank holidays, national days, and cultural events including:
- Bank holidays (Early May, Spring, Summer)
- National days (St. George's Day, St. Andrew's Day, etc.)
- Cultural events (Guy Fawkes Night, Boxing Day, etc.)

### India (32 holidays)
National holidays and major festivals including:
- National days (Republic Day, Independence Day, Gandhi Jayanti)
- Hindu festivals (Holi, Diwali, Dussehra, etc.)
- Other festivals (Eid celebrations, Christmas, etc.)

---

## Post Types & Rotation

### Week 1 (Product-Focused)
1. **Monday**: Product Showcase
2. **Tuesday**: Benefits-Focused
3. **Wednesday**: How-to
4. **Thursday**: Testimonial
5. **Friday**: Product Showcase
6. **Saturday**: Behind-Scenes
7. **Sunday**: Call-to-Action

### Week 2 (Lifestyle-Focused)
1. **Monday**: Benefits-Focused
2. **Tuesday**: How-to
3. **Wednesday**: Testimonial
4. **Thursday**: Behind-Scenes
5. **Friday**: Social Proof
6. **Saturday**: Product Showcase
7. **Sunday**: Call-to-Action

---

## Brand Tones

### Professional
- **Vocabulary**: elevate, premium, excellence, sophisticated, trusted
- **Tone**: Confident and authoritative yet approachable
- **Style**: Clean, structured sentences with focus on benefits

### Casual
- **Vocabulary**: awesome, love, perfect, amazing, game-changer
- **Tone**: Warm, friendly, and enthusiastic
- **Style**: Conversational with contractions and everyday expressions

### Playful
- **Vocabulary**: sparkle, amazing, obsession, vibes, epic, magical
- **Tone**: Upbeat, energetic, and fun-loving
- **Style**: Creative with emojis, wordplay, and exclamation points

### Luxury
- **Vocabulary**: exquisite, refined, exclusive, unparalleled, sophisticated
- **Tone**: Refined, confident, and aspirational
- **Style**: Elegant prose with sophisticated vocabulary

---

## Testing

Run the comprehensive test suite:

```bash
# Make the test file executable
chmod +x test-api.js

# Run all tests (requires Node.js 18+)
node test-api.js

# Test specific store
API_BASE=http://localhost:3000 node test-api.js
```

The test suite covers:
- ✅ Basic product loading
- ✅ Country-specific holiday integration
- ✅ Product selection validation
- ✅ Brand tone variations
- ✅ Weekly calendar generation
- ✅ Error handling
- ✅ Performance benchmarking

---

## Integration Examples

### Frontend JavaScript
```javascript
async function generateCalendar(storeUrl, options = {}) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopify_url: storeUrl,
      country: options.country || 'US',
      brand_tone: options.tone || 'casual',
      selected_products: options.products || [],
      week_number: options.week || 1
    })
  });
  
  return await response.json();
}

// Usage
const calendar = await generateCalendar('thedrugstorecompany.com', {
  country: 'US',
  tone: 'professional',
  week: 1
});
```

### cURL Examples
```bash
# Load products
curl -X POST localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"shopify_url": "thedrugstorecompany.com"}'

# Generate Week 1 calendar
curl -X POST localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "shopify_url": "thedrugstorecompany.com",
    "country": "US",
    "brand_tone": "casual",
    "week_number": 1
  }'
```

---

## Performance Expectations

- **Product Loading**: 2-5 seconds (depends on store size)
- **Calendar Generation**: 3-8 seconds (includes AI processing)
- **Concurrent Requests**: Supports up to 10 simultaneous requests
- **Caching**: 6-hour cache for product data per store
- **Timeout**: 30-second maximum response time

---

## Changelog

### V1.0 (Current)
- ✅ Holiday-aware calendar generation
- ✅ Multi-country support (US/UK/India)
- ✅ Brand tone customization
- ✅ Enhanced product selection
- ✅ Week 1/2 progression
- ✅ Comprehensive API validation

### V0 (Legacy - Deprecated)
- Basic caption generation
- Single product focus
- No holiday integration
- Limited customization

---

## Support

For API issues or questions:
- Check the test suite output for specific error details
- Verify store URL is accessible and has published products
- Ensure rate limits are not exceeded
- Review request format matches documentation examples

The API is designed to be robust and provide helpful error messages for troubleshooting.