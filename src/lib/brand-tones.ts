import { BrandTone } from '@/types';

export interface BrandToneDefinition {
  id: BrandTone;
  name: string;
  description: string;
  characteristics: string[];
  example: string;
  hashtags: string[];
  voiceGuidelines: {
    vocabulary: string[];
    tone: string;
    style: string;
    engagement: string;
  };
}

export const BRAND_TONES: BrandToneDefinition[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Sophisticated, trustworthy, and business-focused tone that builds credibility',
    characteristics: [
      'Clear and concise messaging',
      'Industry expertise focus',
      'Quality and reliability emphasis',
      'Formal but approachable language'
    ],
    example: 'Elevate your workspace with our premium collection. Designed for professionals who value quality and performance. ✨ #PremiumQuality #BusinessEssentials',
    hashtags: ['#Professional', '#Quality', '#Premium', '#Reliable', '#Trusted'],
    voiceGuidelines: {
      vocabulary: ['elevate', 'premium', 'excellence', 'sophisticated', 'proven', 'trusted', 'quality', 'professional'],
      tone: 'Confident and authoritative yet approachable',
      style: 'Clean, structured sentences with focus on benefits',
      engagement: 'Emphasize expertise, testimonials, and proven results'
    }
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Friendly, relatable, and conversational tone that feels like talking to a friend',
    characteristics: [
      'Conversational and warm',
      'Relatable everyday language',
      'Community-focused messaging',
      'Authentic and genuine feel'
    ],
    example: 'Just found the perfect addition to my daily routine! 😍 This has been a total game-changer. Who else loves discovering awesome finds? #DailyFinds #GameChanger',
    hashtags: ['#Relatable', '#Everyday', '#Community', '#Authentic', '#RealTalk'],
    voiceGuidelines: {
      vocabulary: ['awesome', 'love', 'perfect', 'amazing', 'totally', 'just discovered', 'game-changer', 'obsessed'],
      tone: 'Warm, friendly, and enthusiastic',
      style: 'Conversational with contractions and everyday expressions',
      engagement: 'Ask questions, share personal experiences, encourage community'
    }
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Fun, energetic, and creative tone that brings joy and excitement',
    characteristics: [
      'Energetic and vibrant',
      'Creative use of emojis',
      'Fun wordplay and puns',
      'Youthful and trendy vibe'
    ],
    example: 'Ready to add some sparkle to your day? ✨🌟 This little beauty is about to become your new obsession! Who\'s ready to shine? 💫 #SparkleOn #ObsessionWorthy',
    hashtags: ['#Fun', '#Vibrant', '#Trendy', '#Exciting', '#PlayfulVibes'],
    voiceGuidelines: {
      vocabulary: ['sparkle', 'amazing', 'obsession', 'vibes', 'epic', 'magical', 'fabulous', 'incredible'],
      tone: 'Upbeat, energetic, and fun-loving',
      style: 'Creative with emojis, wordplay, and exclamation points',
      engagement: 'Create excitement, use trending phrases, encourage sharing'
    }
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Elegant, exclusive, and aspirational tone that conveys premium brand experience',
    characteristics: [
      'Sophisticated and refined',
      'Exclusive and aspirational',
      'Emphasis on craftsmanship',
      'Understated elegance'
    ],
    example: 'Discover unparalleled elegance in every detail. Crafted for those who appreciate the finest things in life. Experience luxury redefined. 🖤 #LuxuryLifestyle #Craftsmanship',
    hashtags: ['#Luxury', '#Exclusive', '#Elegance', '#Sophistication', '#Premium'],
    voiceGuidelines: {
      vocabulary: ['exquisite', 'refined', 'exclusive', 'unparalleled', 'sophisticated', 'curated', 'artisan', 'heritage'],
      tone: 'Refined, confident, and aspirational',
      style: 'Elegant prose with sophisticated vocabulary',
      engagement: 'Focus on exclusivity, craftsmanship stories, and aspirational lifestyle'
    }
  }
];

// Get brand tone by ID
export function getBrandTone(toneId: BrandTone): BrandToneDefinition | null {
  return BRAND_TONES.find(tone => tone.id === toneId) || null;
}

// Get all available brand tones
export function getAllBrandTones(): BrandToneDefinition[] {
  return BRAND_TONES;
}

// Get brand tone for prompt engineering
export function getBrandTonePrompt(toneId: BrandTone): string {
  const tone = getBrandTone(toneId);
  if (!tone) return '';
  
  return `
Brand Voice: ${tone.name}
Tone: ${tone.voiceGuidelines.tone}
Style: ${tone.voiceGuidelines.style}
Key vocabulary: ${tone.voiceGuidelines.vocabulary.join(', ')}
Engagement style: ${tone.voiceGuidelines.engagement}

Write in a ${tone.name.toLowerCase()} tone that is ${tone.characteristics.join(', ').toLowerCase()}.
  `.trim();
}

// Get suggested hashtags for a brand tone
export function getBrandToneHashtags(toneId: BrandTone): string[] {
  const tone = getBrandTone(toneId);
  return tone?.hashtags || [];
}

// Validate brand tone
export function isValidBrandTone(tone: string): tone is BrandTone {
  return BRAND_TONES.some(t => t.id === tone);
}

// Get default brand tone
export function getDefaultBrandTone(): BrandTone {
  return 'casual';
}

// Get brand tone recommendations based on product type
export function recommendBrandTone(productType?: string): BrandTone[] {
  if (!productType) return ['casual', 'professional'];
  
  const type = productType.toLowerCase();
  
  // Jewelry, fashion, beauty
  if (['jewelry', 'fashion', 'beauty', 'accessories'].includes(type)) {
    return ['luxury', 'playful', 'casual'];
  }
  
  // Business, tech, tools
  if (['business', 'technology', 'tools', 'office'].includes(type)) {
    return ['professional', 'casual'];
  }
  
  // Home, lifestyle, wellness
  if (['home', 'lifestyle', 'wellness', 'health'].includes(type)) {
    return ['casual', 'professional', 'luxury'];
  }
  
  // Kids, games, entertainment
  if (['kids', 'games', 'toys', 'entertainment'].includes(type)) {
    return ['playful', 'casual'];
  }
  
  // Default recommendation
  return ['casual', 'professional'];
}