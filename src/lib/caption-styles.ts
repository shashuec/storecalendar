import { CaptionStyle } from '@/types';

export interface CaptionStyleInfo {
  id: CaptionStyle;
  name: string;
  description: string;
  example: string;
  emoji: string;
}

export const CAPTION_STYLES: CaptionStyleInfo[] = [
  {
    id: 'product_showcase',
    name: 'Product Showcase',
    description: 'Highlight key features and benefits with engaging language',
    example: 'New arrival alert! 🌟 Our organic cotton tee in forest green is here. Soft, sustainable, perfect for any season.',
    emoji: '✨'
  },
  {
    id: 'benefits_focused',
    name: 'Benefits-Focused',
    description: 'Emphasize specific benefits and value to customers',
    example: 'Why choose organic cotton? Breathable, hypoallergenic, and eco-friendly. Your skin (and the planet) will thank you.',
    emoji: '🎯'
  },
  {
    id: 'social_proof',
    name: 'Social Proof',
    description: 'Use testimonials and reviews to build credibility',
    example: '⭐⭐⭐⭐⭐ "Best t-shirt I\'ve ever owned!" - Sarah M. Join 1000+ happy customers who love our organic cotton tees.',
    emoji: '⭐'
  },
  {
    id: 'how_to_style',
    name: 'How-to-Style',
    description: 'Provide styling tips and usage instructions',
    example: 'Style tip: Pair our organic cotton tee with high-waisted jeans and sneakers for the perfect casual look.',
    emoji: '👕'
  },
  {
    id: 'problem_solution',
    name: 'Problem/Solution',
    description: 'Address a problem and present your product as the solution',
    example: 'Tired of scratchy, uncomfortable shirts? 😤 Our organic cotton tee feels like a cloud against your skin.',
    emoji: '💡'
  },
  {
    id: 'behind_scenes',
    name: 'Behind-the-Scenes',
    description: 'Share the story behind the product - craftsmanship, materials, values',
    example: 'From seed to shirt 🌱 Our organic cotton is grown without harmful chemicals, then crafted into the softest tee.',
    emoji: '🌱'
  },
  {
    id: 'call_to_action',
    name: 'Call-to-Action',
    description: 'Create urgency and drive immediate action',
    example: 'Limited stock alert! 🔥 Only 15 organic cotton tees left in your size. Don\'t miss out on ultimate comfort.',
    emoji: '🔥'
  }
];

export const getStyleInfo = (styleId: CaptionStyle): CaptionStyleInfo => {
  return CAPTION_STYLES.find(style => style.id === styleId) || CAPTION_STYLES[0];
};

export const getDefaultSelectedStyles = (): CaptionStyle[] => {
  // Default to first 3 styles for preview
  return ['product_showcase', 'benefits_focused', 'social_proof'];
};