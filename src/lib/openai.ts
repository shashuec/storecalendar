import OpenAI from 'openai';
import { ShopifyProduct, CaptionStyle } from '@/types';
import { supabase } from './supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  shopifyProductId: string,
  style: CaptionStyle,
  prompt: string,
  response: string | null,
  model: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null,
  responseTime: number,
  success: boolean,
  error?: string
) {
  try {
    // Find the database product ID from Shopify product ID
    const { data: product } = await supabase
      .from('calendar_products')
      .select('id')
      .eq('store_id', storeId)
      .eq('shopify_product_id', shopifyProductId)
      .single();
    
    if (!product) {
      console.error('Product not found for logging:', shopifyProductId);
      return;
    }
    
    await supabase.from('calendar_openai_logs').insert({
      store_id: storeId,
      product_id: product.id,
      caption_style: style,
      request_prompt: prompt,
      response_text: response,
      model_used: model,
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      total_tokens: usage?.total_tokens || 0,
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
  storeId?: string
): Promise<Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>> {
  
  const results = [];
  
  for (const product of products.slice(0, 3)) { // Limit to first 3 products for initial generation
    const productCaptions = [];
    
    for (const style of styles) {
      const startTime = Date.now();
      let success = false;
      let captionText = '';
      let error: string | undefined;
      
      try {
        const prompt = `
You are a social media expert creating content for "${storeName}".

Product: ${product.name}
Description: ${product.description}
Price: $${product.price}

Style: ${CAPTION_STYLES[style]}

Create a social media caption that:
- Is 150-280 characters (Instagram/Twitter friendly)
- Includes relevant hashtags (2-3 max)
- Matches the specified style perfectly
- Sounds natural and engaging
- Includes product name naturally

Return only the caption text, no additional formatting or explanations.
        `;

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        });

        captionText = completion.choices[0]?.message?.content?.trim() || '';
        const responseTime = Date.now() - startTime;
        
        if (captionText) {
          productCaptions.push({
            style,
            text: captionText
          });
          success = true;
        }

        // Log the request
        if (storeId) {
          await logOpenAIRequest(
            storeId,
            product.id,
            style,
            prompt,
            captionText,
            process.env.OPENAI_MODEL || 'gpt-4o',
            completion.usage || null,
            responseTime,
            success,
            error
          );
        }
        
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        const responseTime = Date.now() - startTime;
        
        console.error(`Error generating ${style} caption for ${product.name}:`, err);
        
        // Log the failed request
        if (storeId) {
          await logOpenAIRequest(
            storeId,
            product.id,
            style,
            `Error occurred during generation`,
            null,
            process.env.OPENAI_MODEL || 'gpt-4o',
            null,
            responseTime,
            false,
            error
          );
        }
        
        // Continue with other captions even if one fails
      }
    }
    
    if (productCaptions.length > 0) {
      results.push({
        product,
        captions: productCaptions
      });
    }
  }
  
  return results;
}

export async function generatePreviewCaptions(
  products: ShopifyProduct[],
  storeName: string,
  storeId?: string
): Promise<Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>> {
  // Generate only first 3 caption styles for preview
  const previewStyles: CaptionStyle[] = ['product_showcase', 'benefits_focused', 'social_proof'];
  return generateCaptions(products.slice(0, 1), storeName, previewStyles, storeId); // Only first product, first 3 styles
}