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
  product_featured?: ShopifyProduct;
  service_featured?: string; // Service name for service businesses
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

// Business Type definitions
export type BusinessType = 'product' | 'service';

export type ServiceCategory = 
  | 'salon_spa' 
  | 'gym_fitness' 
  | 'food_dining' 
  | 'health_medical' 
  | 'professional_services' 
  | 'other';

// Service offerings by category
export const SERVICE_OFFERINGS = {
  salon_spa: [
    'Hair Cutting & Styling',
    'Hair Coloring',
    'Hair Treatments',
    'Nails',
    'Makeup',
    'Facial Treatments',
    'Waxing',
    'Massage',
    'Eyebrows & Lashes',
    'Body Treatments',
    'Bridal Services',
    'Men\'s Grooming'
  ],
  gym_fitness: [
    'Personal Training',
    'Group Classes',
    'Yoga',
    'Pilates',
    'CrossFit',
    'Cardio Equipment',
    'Weight Training',
    'Swimming Pool',
    'Nutrition Coaching',
    'Sports Training',
    'Rehabilitation',
    'Kids Programs'
  ],
  food_dining: [
    'Dine-in',
    'Takeout',
    'Delivery',
    'Catering',
    'Private Events',
    'Bar Service',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Brunch',
    'Happy Hour',
    'Special Diets'
  ],
  health_medical: [
    'General Practice',
    'Specialist Care',
    'Dental Services',
    'Physical Therapy',
    'Mental Health',
    'Pediatrics',
    'Diagnostics',
    'Preventive Care',
    'Telemedicine',
    'Emergency Care',
    'Pharmacy',
    'Alternative Medicine'
  ],
  professional_services: [
    'Consulting',
    'Legal Services',
    'Accounting',
    'Marketing',
    'IT Services',
    'Real Estate',
    'Insurance',
    'Financial Planning',
    'Business Strategy',
    'HR Services',
    'Design Services',
    'Education & Training'
  ],
  other: [
    'Custom Service 1',
    'Custom Service 2',
    'Custom Service 3',
    'Custom Service 4'
  ]
};

export interface ServiceBusiness {
  businessName: string;
  location: string;
  website?: string;
  businessUrl?: string; // For database compatibility
  category: ServiceCategory;
  services: string[];
  businessHours?: string;
  contactInfo?: string;
  contentGoals: string[];
  brandVoice: BrandTone;
  brandTone?: BrandTone; // Alias for brandVoice
  targetAudience: {
    ageRange: string;
    gender: string;
    style: string;
  };
  scrapedContent?: string; // Raw scraped content
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