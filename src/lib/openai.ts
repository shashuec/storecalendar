import OpenAI from 'openai';
import { ShopifyProduct, CaptionStyle, BrandTone, CountryCode, ServiceBusiness, Holiday } from '@/types';
import { supabase } from './supabase';
import { getBrandTonePrompt } from './brand-tones';
import { getUpcomingHolidays } from './holidays';

// Create OpenAI client lazily to avoid module-level environment variable issues
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is missing or empty');
  }
  return new OpenAI({
    apiKey,
  });
}

const CAPTION_STYLES: Record<CaptionStyle, string> = {
  product_showcase: 'Create a compelling product showcase post that highlights the key features and benefits. Use emojis and engaging language.',
  benefits_focused: 'Focus on the specific benefits this product provides to customers. Emphasize value and outcomes.',
  social_proof: 'Write as if sharing customer testimonials or reviews. Use social proof language and credibility indicators.',
  how_to_style: 'Create styling tips or usage instructions. Show customers how to use or style this product.',
  problem_solution: 'Address a specific problem this product solves. Start with the pain point, then present the solution.',
  behind_scenes: 'Share the story behind the product - craftsmanship, materials, or brand values. Make it personal.',
  call_to_action: 'Create urgency and drive immediate action. Use strong CTAs and scarcity/urgency elements.'
};

async function logOpenAIRequest(
  storeId: string,
  productName: string,
  model: string,
  usage: { total_tokens?: number } | null,
  responseTime: number,
  success: boolean,
  error?: string
) {
  try {
    // Calculate approximate cost in cents (GPT-4o pricing: ~$15 per 1M tokens)
    const totalTokens = usage?.total_tokens || 0;
    const costCents = Math.round((totalTokens / 1000000) * 1500); // $15 per 1M tokens = 1500 cents
    
    await supabase.from('calendar_openai_logs').insert({
      store_id: storeId,
      product_name: productName,
      model_used: model,
      total_tokens: totalTokens,
      cost_cents: costCents,
      response_time_ms: responseTime,
      success,
      error_message: error
    });
  } catch (logError) {
    console.error('Failed to log OpenAI request:', logError);
  }
}

export async function generateCaptions(
  products: ShopifyProduct[],
  storeName: string,
  styles: CaptionStyle[] = Object.keys(CAPTION_STYLES) as CaptionStyle[],
  storeId?: string,
  brandTone: BrandTone = 'casual',
  country: CountryCode = 'US'
): Promise<Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>> {
  
  // PARALLEL PROCESSING: Generate captions for all products simultaneously
  const generateSingleProductCaptions = async (product: ShopifyProduct) => {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let completion: OpenAI.ChatCompletion;
    
    try {
      // Get brand tone guidance
      const brandToneGuidance = getBrandTonePrompt(brandTone);
      
      // Get upcoming holidays for context
      const upcomingHolidays = getUpcomingHolidays(country, 14); // Next 2 weeks
      
      // Strengthen holiday context integration
      let holidayContext = '';
      if (upcomingHolidays.length > 0) {
        const nextHolidays = upcomingHolidays.slice(0, 3);
        const holidayTypes = nextHolidays.map(h => h.type).join(', ');
        holidayContext = `\n\n🎯 HOLIDAY INTEGRATION REQUIRED:
Upcoming holidays: ${nextHolidays.map(h => `${h.name} (${h.date}, ${h.type})`).join(', ')}

MUST incorporate holiday themes naturally by:
- For gift-giving holidays: Emphasize product as perfect gift, mention gifting occasions
- For shopping holidays: Create urgency, mention sales/deals context  
- For celebration holidays: Use festive language, celebratory tone
- For seasonal holidays: Connect product to season, weather, or timing
- For festival/cultural holidays: Respect cultural significance, use appropriate language

Make holiday connection feel natural and relevant to the product.`;
      }
      
      // Create style descriptions for the prompt
      const styleDescriptions = styles.map(style => `
${style.toUpperCase().replace('_', ' ')}: ${CAPTION_STYLES[style]}`).join('');
      
      const prompt = `
You are a social media expert creating content for "${storeName}".

${brandToneGuidance}${holidayContext}

Product: ${product.name}
Description: ${product.description}
Price: ${product.price}
${product.url ? `Product URL: ${product.url}` : ''}

Generate ${styles.length} different social media captions for this product using these styles:${styleDescriptions}

For each caption:
- Follow the ${brandTone} brand tone guidelines above
- Keep main text 150-280 characters (Instagram/Twitter friendly)
- Include 2-3 relevant hashtags max
- Make it sound natural and engaging
- Include product name naturally
- PRIORITY: Integrate upcoming holidays meaningfully (see holiday integration requirements above)
- Use holiday-specific language, timing, and emotional triggers when holidays are present
- Always end with a call-to-action link: "\\n\\n🛒 Shop now: [product URL]" if URL is available

Return ONLY a JSON object with this exact format:
{
  "${styles[0]}": "caption text here",
  "${styles[1]}": "caption text here",
  ${styles.slice(2).map(style => `"${style}": "caption text here"`).join(',\n  ')}
}

Return only the JSON, no additional text or formatting.
      `;

      const openai = getOpenAIClient();
      completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800, // Increased for multiple captions
        temperature: 0.7,
      });

      let responseText = completion.choices[0]?.message?.content?.trim() || '';
      const responseTime = Date.now() - startTime;
      
      if (responseText) {
        try {
          // Clean the response - remove markdown code blocks if present
          responseText = responseText.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
          
          // Parse the JSON response
          const captionsJson = JSON.parse(responseText);
          const productCaptions = [];
          
          // Extract captions for each style
          for (const style of styles) {
            if (captionsJson[style]) {
              productCaptions.push({
                style,
                text: captionsJson[style]
              });
            }
          }
          
          if (productCaptions.length > 0) {
            success = true;
            
            // Log the successful request
            if (storeId) {
              await logOpenAIRequest(
                storeId,
                product.name,
                process.env.OPENAI_MODEL || 'gpt-4o',
                completion.usage || null,
                responseTime,
                success,
                undefined
              );
            }
            
            return {
              product,
              captions: productCaptions
            };
          }
          
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', parseError);
          console.error('Response was:', responseText);
          error = 'Failed to parse response';
        }
      }

      // Log failed request
      if (storeId) {
        await logOpenAIRequest(
          storeId,
          product.name,
          process.env.OPENAI_MODEL || 'gpt-4o',
          completion.usage || null,
          responseTime,
          false,
          error || 'No response content'
        );
      }
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      const responseTime = Date.now() - startTime;
      
      console.error(`Error generating captions for ${product.name}:`, err);
      
      // If quota exceeded, use mock data for testing
      if (error.includes('429') || error.includes('quota')) {
        console.log('OpenAI quota exceeded - using mock captions for testing');
        const mockCaptions = [];
        for (const style of styles) {
          mockCaptions.push({
            style,
            text: `✨ Sample ${style.replace('_', ' ')} caption for ${product.name}. This is a demo caption while OpenAI quota is exceeded. #Demo #Testing`
          });
        }
        
        if (mockCaptions.length > 0) {
          return {
            product,
            captions: mockCaptions
          };
        }
      }
      
      // Log the failed request
      if (storeId) {
        await logOpenAIRequest(
          storeId,
          product.name,
          process.env.OPENAI_MODEL || 'gpt-4o',
          null,
          responseTime,
          false,
          error
        );
      }
    }
    
    // Return null if failed
    return null;
  };
  
  // Process ALL products in parallel - THIS IS THE KEY OPTIMIZATION
  console.log(`🚀 Generating captions for ${products.length} products in parallel...`);
  const promises = products.map(product => generateSingleProductCaptions(product));
  const results = await Promise.all(promises);
  
  // Filter out null results (failed generations)
  const successfulResults = results.filter(result => result !== null) as Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>;
  
  console.log(`✅ Successfully generated captions for ${successfulResults.length}/${products.length} products`);
  return successfulResults;
}

export async function generateAllCaptions(
  products: ShopifyProduct[],
  storeName: string,
  storeId?: string,
  brandTone: BrandTone = 'casual',
  country: CountryCode = 'US'
): Promise<Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>> {
  // Generate ALL 7 caption styles for ALL selected products
  const allStyles: CaptionStyle[] = Object.keys(CAPTION_STYLES) as CaptionStyle[];
  return generateCaptions(products, storeName, allStyles, storeId, brandTone, country); // Process ALL selected products
}

// Generate caption for service business
export async function generateServiceCaption(
  business: ServiceBusiness & { usedServices?: string[]; selectedService?: string },
  postType: string,
  dayName: string,
  holiday?: Holiday
): Promise<string> {
  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  
  try {
    // Get brand tone guidance
    const brandToneGuidance = getBrandTonePrompt(business.brandVoice);
    
    // Build holiday context
    let holidayContext = '';
    if (holiday) {
      holidayContext = `\n\n🎯 HOLIDAY CONTEXT:
${holiday.name} (${holiday.date}) - Type: ${holiday.type}
Incorporate this holiday naturally into the post. Make it relevant to the service business.`;
    }
    
    // Build content goals context
    const goalsContext = business.contentGoals.map(goal => {
      const goalMap: { [key: string]: string } = {
        'appointments': 'Drive appointments and bookings',
        'showcase': 'Showcase transformations and results',
        'community': 'Build local community connection',
        'offers': 'Promote special offers and deals',
        'expertise': 'Share expertise and professional tips',
        'newservices': 'Announce new services',
        'seasonal': 'Seasonal promotions',
        'testimonials': 'Share client testimonials'
      };
      return goalMap[goal] || goal;
    }).join(', ');
    
    // Build services context - aggressively shuffle and select specific service for this day
    const shuffledServices = [...business.services].sort(() => 0.5 - Math.random());
    const availableServices = business.usedServices && business.usedServices.length > 0 
      ? shuffledServices.filter(service => !business.usedServices!.includes(service))
      : shuffledServices;
    
    // Use the pre-selected service from the calling function, or fall back to selection logic
    const selectedService = business.selectedService || (availableServices.length > 0 ? availableServices[0] : shuffledServices[0]);
    
    const usedServicesContext = business.usedServices && business.usedServices.length > 0 ? 
      `\n\n⚠️ SERVICES ALREADY USED: ${business.usedServices.join(', ')}` : '';
    
    const serviceVarietyNote = business.services.length > 1 ? 
      `\n\n🎯 MANDATORY SERVICE FOR THIS POST:
- YOU MUST feature this specific service: "${selectedService}"
- DO NOT mention any other services in the caption
- Focus the entire caption around: "${selectedService}"
- Make "${selectedService}" the hero of this ${postType} post${usedServicesContext}` : '';
    
    const prompt = `
You are a social media expert creating content for "${business.businessName}", a ${business.category.replace('_', ' ')} business.

${brandToneGuidance}

BUSINESS DETAILS:
- Category: ${business.category.replace('_', ' ')}
- Location: ${business.location}
- FEATURED SERVICE FOR THIS POST: ${selectedService}
- Target Audience: ${business.targetAudience.ageRange} age group, ${business.targetAudience.gender}, ${business.targetAudience.style}
- Content Goals: ${goalsContext}${holidayContext}${serviceVarietyNote}

Create a ${postType} post for ${dayName}.

CRITICAL REQUIREMENTS:
1. 🎯 MANDATORY: Feature ONLY "${selectedService}" in this caption
2. 🚫 FORBIDDEN: Do not mention any other services except "${selectedService}"
3. Create the entire ${postType} post around "${selectedService}" specifically
4. Keep caption 150-280 characters (Instagram/Facebook optimized)
5. Include 2-3 hashtags specifically related to "${selectedService}"
6. Include location: 📍 ${business.location}
7. End with clear call-to-action about "${selectedService}" (Book ${selectedService}, Try ${selectedService}, etc.)
8. Make it authentic to ${business.category.replace('_', ' ')} business
9. If holiday context provided, incorporate naturally with "${selectedService}"
10. Match the ${business.brandVoice} brand voice exactly

CAPTION FOCUS: Make "${selectedService}" the hero of this post. Every sentence should relate to "${selectedService}".

Return ONLY the caption text, nothing else.`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media content creator for service businesses. Create engaging, authentic posts that drive customer action.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
    });
    
    const captionText = completion.choices[0]?.message?.content?.trim();
    
    if (captionText) {
      // Add business website if available
      const websiteLink = business.website ? `\n\n🔗 ${business.website}` : '';
      return `${captionText}${websiteLink}`;
    }
    
    throw new Error('No caption generated');
    
  } catch (error) {
    console.error('Error generating service caption:', error);
    // Return a fallback caption
    return createServiceFallback(business, postType, dayName, holiday);
  }
}

// Fallback caption for service businesses
function createServiceFallback(
  business: ServiceBusiness,
  postType: string,
  dayName: string,
  holiday?: Holiday
): string {
  const holidayMention = holiday ? ` Perfect timing for ${holiday.name}!` : '';
  const services = business.services.slice(0, 2).join(' & ');
  
  const baseCaption = `🌟 ${postType} at ${business.businessName}!${holidayMention} Experience our amazing ${services} services. Your satisfaction is our priority!`;
  const location = `\n\n📍 ${business.location}`;
  const cta = business.website ? `\n🔗 Book now: ${business.website}` : '\n📞 Call us to book!';
  
  return `${baseCaption}${location}${cta} #${business.category.replace('_', '')} #LocalBusiness`;
}