# StoreCalendar: Product Vision & Roadmap

## Core Vision
Transform Shopify stores into consistent social media presence with AI-generated, holiday-aware content calendars.

---

## V1: Holiday-Aware Weekly Calendar Generator

### What V1 Delivers:
- **Input**: Shopify URL → Country → Product Selection → Brand Tone
- **Output**: 7-day social calendar with smart holiday integration
- **Time**: 60-90 seconds generation
- **Export**: Copy individual posts + CSV download

### Key Features:
1. **Smart Shopify Integration**
   - Fetch up to 50 products
   - Auto-select top 5, user can modify
   - Handle invalid/private stores gracefully

2. **Holiday Intelligence**
   - 101+ holidays for US/UK/India 2025
   - Smart integration (only when relevant)
   - Natural mention, not forced

3. **Brand Customization**
   - 4 tone options: Professional, Casual, Playful, Luxury
   - Consistent voice across all posts

4. **Content Variety**
   - 4 post types: Product Showcase, Testimonial, How-to, Behind-Scenes
   - Rotated across 7 days for variety

5. **Week Progression**
   - Week 1: Product-focused content
   - Week 2: Lifestyle/use-case focused
   - Natural user retention

### User Journey V1:
```
1. Enter Shopify URL → Products loaded
2. Select country (US/UK/India) → Holidays detected
3. Choose 3-10 products → Auto-selected 5, modify if needed
4. Pick brand tone → Professional/Casual/Playful/Luxury
5. Generate calendar → 3 API calls, 60-90 seconds
6. View results → 7 posts with day labels
7. Copy/Export → Individual copy + CSV download
8. Generate Week 2 → Different angles, same products
```

### Tech Stack V1:
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, OpenAI GPT-4o-mini
- **Database**: Supabase (email collection, rate limiting)
- **Deployment**: Vercel

### Success Metrics V1:
- 100 calendars generated in first week
- 50 email collections
- <90 second generation time
- 85% successful generations

---

## V2: Advanced Features (Post-Launch)

### Planned V2 Enhancements:
1. **User Accounts & Saved Calendars**
   - Supabase Auth integration
   - Save/load previous calendars
   - Usage history and analytics

2. **Advanced Content Options**
   - AI image generation (DALL-E)
   - Video script templates
   - Email marketing content
   - Multiple caption variations

3. **Social Media Integration**
   - Direct posting to Instagram/Facebook/LinkedIn
   - Auto-scheduling with optimal times
   - Platform-specific formatting
   - Cross-posting management

4. **Analytics & Optimization**
   - Performance tracking per post type
   - A/B testing for captions
   - Engagement prediction
   - Content recommendations

5. **Team & Enterprise Features**
   - Multi-user accounts
   - Brand guidelines enforcement
   - Approval workflows
   - White-label options

6. **Advanced Holiday Features**
   - Custom holiday additions
   - Regional micro-holidays
   - Industry-specific events
   - Seasonal campaign planning

### Monetization Strategy:
- **V1**: Free with email gate (validate demand)
- **V2**: $19/month for unlimited calendars + advanced features
- **Enterprise**: $99/month for team features

---

## Long-term Vision (V3+)

### Market Expansion:
- Support for WooCommerce, BigCommerce
- Etsy and Amazon seller integration
- General e-commerce platform support

### AI Evolution:
- Store-specific performance learning
- Competitor analysis integration
- Trend prediction and recommendations
- Voice and video content generation

### Platform Growth:
- TikTok, Pinterest, YouTube integration
- Marketplace for content templates
- Community features and sharing
- Agency/reseller program

---

## Success Indicators:

### V1 Success:
- Product-market fit validation
- 500+ active users
- 50+ email conversions
- Positive user feedback

### V2 Success:
- $5k MRR
- 80% user retention
- Feature adoption >60%
- Enterprise inquiries

### Long-term Success:
- $100k ARR
- Market leader in Shopify social content
- 10k+ active stores
- Platform partnerships

This roadmap ensures we build incrementally, validate at each stage, and scale based on real user feedback and market demand.