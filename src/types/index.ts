export interface ShopifyProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
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

export interface GenerationRequest {
  shopify_url: string;
  email?: string;
  selected_styles?: CaptionStyle[];
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
}