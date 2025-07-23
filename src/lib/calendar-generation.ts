import { ShopifyProduct, WeeklyCalendar, CalendarPost, CountryCode, BrandTone, CaptionStyle, Holiday } from '@/types';
import { getUpcomingHolidays, getHolidayRelevanceScore } from './holidays';
import { generateCaptions } from './openai';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const _POST_TYPES = [
  'Product Showcase',
  'Testimonial', 
  'How-to',
  'Behind-Scenes',
  'Benefits-Focused',
  'Social Proof',
  'Call-to-Action'
];

// Map caption styles to post types for calendar
const CAPTION_STYLE_TO_POST_TYPE: Record<CaptionStyle, string> = {
  'product_showcase': 'Product Showcase',
  'social_proof': 'Testimonial',
  'how_to_style': 'How-to',
  'behind_scenes': 'Behind-Scenes',
  'benefits_focused': 'Benefits-Focused',
  'problem_solution': 'Social Proof',
  'call_to_action': 'Call-to-Action'
};

// Get next 7 days starting from today
function getNext7Days(): string[] {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Get day name from date string
function getDayName(dateString: string): string {
  const date = new Date(dateString);
  return DAYS_OF_WEEK[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for Monday start
}

// Distribute products across 7 days with variety
function distributeProductsAcrossDays(products: ShopifyProduct[]): ShopifyProduct[] {
  const productCycle = [];
  let productIndex = 0;
  
  for (let i = 0; i < 7; i++) {
    productCycle.push(products[productIndex % products.length]);
    productIndex++;
  }
  
  return productCycle;
}

// Create optimal post type rotation for the week
function createPostTypeRotation(weekNumber: 1 | 2): string[] {
  if (weekNumber === 1) {
    // Week 1: Product-focused content
    return [
      'Product Showcase',    // Monday - Strong start
      'Benefits-Focused',    // Tuesday - Value proposition
      'How-to',             // Wednesday - Educational
      'Testimonial',        // Thursday - Social proof
      'Product Showcase',    // Friday - Another feature
      'Behind-Scenes',      // Saturday - Brand story
      'Call-to-Action'      // Sunday - Weekend action
    ];
  } else {
    // Week 2: Lifestyle-focused content
    return [
      'Benefits-Focused',    // Monday - Start with value
      'How-to',             // Tuesday - Educational lifestyle
      'Testimonial',        // Wednesday - User experiences
      'Behind-Scenes',      // Thursday - Brand culture
      'Social Proof',       // Friday - Community focus
      'Product Showcase',    // Saturday - Weekend feature
      'Call-to-Action'      // Sunday - Engagement
    ];
  }
}

// Generate a weekly calendar from products and captions
export async function generateWeeklyCalendar(
  products: ShopifyProduct[],
  storeName: string,
  country: CountryCode,
  brandTone: BrandTone,
  weekNumber: 1 | 2 = 1,
  storeId?: string,
  existingCaptions?: Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>
): Promise<WeeklyCalendar> {
  
  // Get next 7 days
  const dates = getNext7Days();
  const startDate = dates[0];
  const endDate = dates[6];
  
  // Get holidays for the week
  const _weekStart = new Date(startDate);
  const _weekEnd = new Date(endDate);
  const weekHolidays = getUpcomingHolidays(country, 7); // Remove await - not async
  
  // Create holiday map by date
  const holidayMap = new Map();
  weekHolidays.forEach(holiday => {
    holidayMap.set(holiday.date, holiday);
  });
  
  // Use existing captions if provided, otherwise generate new ones
  let captionResults;
  if (existingCaptions && existingCaptions.length > 0) {
    // Reuse existing captions - NO AI CALL
    captionResults = existingCaptions;
  } else {
    // Fallback: generate captions if not provided (backward compatibility)
    const allStyles: CaptionStyle[] = [
      'product_showcase', 'benefits_focused', 'how_to_style', 
      'behind_scenes', 'social_proof', 'problem_solution', 'call_to_action'
    ];
    
    captionResults = await generateCaptions(
      products, 
      storeName, 
      allStyles, 
      storeId, 
      brandTone, 
      country
    );
  }
  
  // Create caption map by product and style
  const captionMap = new Map();
  captionResults.forEach(result => {
    result.captions.forEach(caption => {
      const key = `${result.product.id}-${caption.style}`;
      captionMap.set(key, caption.text);
    });
  });
  
  // Distribute products and post types across the week
  const productCycle = distributeProductsAcrossDays(products);
  const postTypeRotation = createPostTypeRotation(weekNumber);
  
  // Create calendar posts
  const posts: CalendarPost[] = dates.map((date, index) => {
    const day = getDayName(date);
    const product = productCycle[index];
    const postType = postTypeRotation[index];
    const holiday = holidayMap.get(date);
    
    // Find matching caption style for post type
    const captionStyle = Object.keys(CAPTION_STYLE_TO_POST_TYPE).find(
      style => CAPTION_STYLE_TO_POST_TYPE[style as CaptionStyle] === postType
    ) as CaptionStyle;
    
    // Get caption text
    const captionKey = `${product.id}-${captionStyle}`;
    let captionText = captionMap.get(captionKey);
    
    // If no caption found, create a complete fallback post
    if (!captionText) {
      captionText = createFallbackCaption(product, postType, brandTone, holiday);
    }
    
    // Add holiday context if relevant and not forced
    if (holiday && getHolidayRelevanceScore(holiday) >= 6) {
      // Subtle holiday integration - don't force it
      if (!captionText.toLowerCase().includes(holiday.name.toLowerCase())) {
        const holidayMention = getHolidayMention(holiday, postType);
        if (holidayMention) {
          captionText = `${holidayMention} ${captionText}`;
        }
      }
    }
    
    return {
      id: `${date}-${product.id}`,
      day,
      date,
      post_type: postType,
      caption_text: captionText,
      product_featured: product,
      holiday_context: holiday || undefined
    };
  });
  
  return {
    week_number: weekNumber,
    start_date: startDate,
    end_date: endDate,
    posts,
    country,
    brand_tone: brandTone,
    selected_products: products
  };
}

// Create fallback caption when AI caption is not available
function createFallbackCaption(product: ShopifyProduct, postType: string, brandTone: BrandTone, holiday?: Holiday): string {
  const productName = product.name;
  const price = product.price;
  const productLink = product.url ? `\n\n🛒 Shop now: ${product.url}` : '';
  // Enhanced holiday integration for fallbacks
  let holidayContext = '';
  if (holiday) {
    switch (holiday.type) {
      case 'gift-giving':
        holidayContext = ` Perfect ${holiday.name} gift idea!`;
        break;
      case 'shopping':
        holidayContext = ` Don't miss out this ${holiday.name}!`;
        break;
      case 'celebration':
        holidayContext = ` Celebrate ${holiday.name} in style!`;
        break;
      case 'seasonal':
        holidayContext = ` Perfect timing for ${holiday.name}!`;
        break;
      case 'festival':
        holidayContext = ` Make your ${holiday.name} special!`;
        break;
      default:
        holidayContext = ` Perfect for ${holiday.name}!`;
    }
  }
  
  switch (postType) {
    case 'Product Showcase':
      return `✨ Meet ${productName}! ${price}${holidayContext} This amazing product combines quality and style in one perfect package. Ready to elevate your experience?${productLink} #ProductShowcase #QualityMatters`;
      
    case 'Benefits-Focused':
      return `Why choose ${productName}? 🎯 Superior quality, great value at ${price}, and results you can trust.${holidayContext} Experience the difference today!${productLink} #BenefitsFocused #ValueForMoney`;
      
    case 'How-to':
      return `Pro tip: Get the most out of your ${productName} with these simple steps! 📚 Step 1: Unbox and admire. Step 2: Follow included instructions. Step 3: Enjoy the results!${holidayContext}${productLink} #HowTo #ProTips`;
      
    case 'Testimonial':
      return `"I absolutely love my ${productName}! Worth every penny at ${price}." - Happy Customer ⭐⭐⭐⭐⭐${holidayContext} Join thousands of satisfied customers!${productLink} #Testimonial #CustomerLove`;
      
    case 'Behind-Scenes':
      return `Behind the scenes: Creating ${productName} takes passion, precision, and attention to detail. 🎬 That's why we're proud to offer it at ${price}.${holidayContext}${productLink} #BehindTheScenes #CraftedWithCare`;
      
    case 'Social Proof':
      return `Thousands of customers can't be wrong! ${productName} at ${price} continues to be our bestseller. ⭐${holidayContext} See what the buzz is all about!${productLink} #SocialProof #Bestseller`;
      
    case 'Call-to-Action':
      return `Don't wait! ${productName} at ${price} is flying off the shelves. 🔥${holidayContext} Order now and experience the difference for yourself!${productLink} #CallToAction #DontMissOut`;
      
    default:
      return `✨ Discover ${productName} at ${price}! Quality you can trust, value you'll love.${holidayContext}${productLink} #Featured #QualityFirst`;
  }
}

// Get enhanced holiday mention for post types
function getHolidayMention(holiday: Holiday, postType: string): string | null {
  const holidayName = holiday.name;
  
  switch (holiday.type) {
    case 'gift-giving':
      if (postType === 'Product Showcase') {
        return `🎁 Perfect ${holidayName} gift!`;
      }
      if (postType === 'Call-to-Action') {
        return `⏰ ${holidayName} is almost here!`;
      }
      if (postType === 'Benefits-Focused') {
        return `🎁 Make ${holidayName} memorable!`;
      }
      break;
      
    case 'shopping':
      if (postType === 'Product Showcase' || postType === 'Call-to-Action') {
        return `🛍️ ${holidayName} deals inside!`;
      }
      if (postType === 'Benefits-Focused') {
        return `💰 ${holidayName} savings ahead!`;
      }
      break;
      
    case 'seasonal':
      if (postType === 'Benefits-Focused' || postType === 'How-to') {
        return `🍂 Perfect for ${holidayName}!`;
      }
      if (postType === 'Product Showcase') {
        return `🌟 ${holidayName} vibes!`;
      }
      break;
      
    case 'celebration':
      if (postType === 'Testimonial' || postType === 'Behind-Scenes') {
        return `🎉 Celebrating ${holidayName}!`;
      }
      if (postType === 'Product Showcase') {
        return `✨ ${holidayName} ready!`;
      }
      break;
      
    case 'festival':
      if (postType === 'Product Showcase') {
        return `🪔 Perfect for ${holidayName}!`;
      }
      if (postType === 'Benefits-Focused') {
        return `🎊 Make ${holidayName} special!`;
      }
      break;
  }
  
  return `🎯 Perfect for ${holidayName}!`; // Default fallback
}

// Export calendar to CSV format
export function exportCalendarToCSV(calendar: WeeklyCalendar): string {
  const headers = [
    'Day',
    'Date', 
    'Post Type',
    'Caption',
    'Product',
    'Price',
    'Holiday Context',
    'Optimal Time'
  ];
  
  const rows = calendar.posts.map(post => [
    post.day,
    post.date,
    post.post_type,
    `"${post.caption_text.replace(/"/g, '""')}"`, // Escape quotes
    post.product_featured.name,
    post.product_featured.price,
    post.holiday_context?.name || '',
    getOptimalPostingTime(post.day)
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

// Get optimal posting time for each day
function getOptimalPostingTime(day: string): string {
  const times: Record<string, string> = {
    'Monday': '9:00 AM',
    'Tuesday': '10:00 AM', 
    'Wednesday': '12:00 PM',
    'Thursday': '2:00 PM',
    'Friday': '3:00 PM',
    'Saturday': '11:00 AM',
    'Sunday': '1:00 PM'
  };
  
  return times[day] || '12:00 PM';
}