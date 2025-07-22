export interface ShopifyProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  url: string;
  handle?: string;
}

export interface Store {
  id: string;
  shopify_url: string;
  store_name: string;
  created_at: string;
  last_scraped: string;
}

export interface Caption {
  id: string;
  product_id: string;
  caption_text: string;
  caption_style: CaptionStyle;
  created_at: string;
}

export type CaptionStyle = 
  | 'product_showcase'
  | 'benefits_focused'
  | 'social_proof'
  | 'how_to_style'
  | 'problem_solution'
  | 'behind_scenes'
  | 'call_to_action';

// Holiday system types
export type CountryCode = 'US' | 'UK' | 'IN';

export type HolidayType = 
  | 'celebration' 
  | 'gift-giving' 
  | 'shopping' 
  | 'patriotic' 
  | 'festival' 
  | 'seasonal' 
  | 'environmental';

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: HolidayType;
}

// Brand tone types
export type BrandTone = 'professional' | 'casual' | 'playful' | 'luxury';

// Enhanced product interface
export interface ShopifyProductEnhanced extends ShopifyProduct {
  selected?: boolean;
  rank?: number;
  product_type?: string;
  vendor?: string;
  tags?: string[];
}

// Weekly calendar types
export interface CalendarPost {
  id: string;
  day: string; // Monday, Tuesday, etc.
  date: string; // YYYY-MM-DD
  post_type: string; // Product Showcase, Testimonial, etc.
  caption_text: string;
  product_featured: ShopifyProduct;
  holiday_context?: Holiday;
}

export interface WeeklyCalendar {
  week_number: 1 | 2;
  start_date: string;
  end_date: string;
  posts: CalendarPost[];
  country: CountryCode;
  brand_tone: BrandTone;
  selected_products: ShopifyProduct[];
}

export interface GenerationRequest {
  shopify_url: string;
  email?: string;
  selected_styles?: CaptionStyle[];
  // V1 additions
  country?: CountryCode;
  selected_products?: string[]; // Product IDs
  brand_tone?: BrandTone;
  week_number?: 1 | 2;
}

export interface GenerationResponse {
  success: boolean;
  store_name?: string;
  products?: ShopifyProduct[];
  captions?: Caption[];
  preview_captions?: Caption[]; // First 3 captions
  all_captions?: Caption[]; // All 7 captions generated upfront
  error?: string;
  requires_email?: boolean;
  email_stored?: boolean; // Flag when email is successfully stored
  message?: string;
  // V1 additions
  weekly_calendar?: WeeklyCalendar;
  upcoming_holidays?: Holiday[];
  enhanced_products?: ShopifyProductEnhanced[];
  calendar_id?: string; // For sharing functionality
}

// User authentication types
export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  picture?: string;
  created_at: string;
  updated_at: string;
}