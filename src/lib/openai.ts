import OpenAI from 'openai';
import { ShopifyProduct, CaptionStyle, BrandTone, CountryCode, Holiday } from '@/types';
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
  
  const results = [];
  
  for (const product of products.slice(0, 3)) { // Limit to first 3 products for initial generation
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let completion: OpenAI.ChatCompletion;
    
    try {
      // Get brand tone guidance
      const brandToneGuidance = getBrandTonePrompt(brandTone);
      
      // Get upcoming holidays for context
      const upcomingHolidays = getUpcomingHolidays(country, 14); // Next 2 weeks
      const holidayContext = upcomingHolidays.length > 0 
        ? `\n\nUpcoming holidays to consider (optional, only if relevant): ${upcomingHolidays.slice(0, 3).map(h => `${h.name} (${h.date})`).join(', ')}`
        : '';
      
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
- If relevant, subtly reference upcoming holidays (don't force it)
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
            results.push({
              product,
              captions: productCaptions
            });
            success = true;
          }
          
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', parseError);
          console.error('Response was:', responseText);
          error = 'Failed to parse response';
        }
      }

      // Log the request (single log for all styles)
      if (storeId) {
        await logOpenAIRequest(
          storeId,
          product.name,
          process.env.OPENAI_MODEL || 'gpt-4o-mini',
          completion.usage || null,
          responseTime,
          success,
          error
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
          results.push({
            product,
            captions: mockCaptions
          });
          success = true;
        }
      }
      
      // Log the failed request
      if (storeId) {
        await logOpenAIRequest(
          storeId,
          product.name,
          process.env.OPENAI_MODEL || 'gpt-4o-mini',
          null,
          responseTime,
          false,
          error
        );
      }
    }
  }
  
  return results;
}

export async function generateAllCaptions(
  products: ShopifyProduct[],
  storeName: string,
  storeId?: string,
  brandTone: BrandTone = 'casual',
  country: CountryCode = 'US'
): Promise<Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>> {
  // Generate ALL 7 caption styles upfront
  const allStyles: CaptionStyle[] = Object.keys(CAPTION_STYLES) as CaptionStyle[];
  return generateCaptions(products.slice(0, 1), storeName, allStyles, storeId, brandTone, country); // Only first product, ALL 7 styles
}