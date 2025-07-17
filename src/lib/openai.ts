import OpenAI from 'openai';
import { ShopifyProduct, CaptionStyle } from '@/types';

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

export async function generateCaptions(
  products: ShopifyProduct[],
  storeName: string,
  styles: CaptionStyle[] = Object.keys(CAPTION_STYLES) as CaptionStyle[]
): Promise<Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>> {
  
  const results = [];
  
  for (const product of products.slice(0, 3)) { // Limit to first 3 products for initial generation
    const productCaptions = [];
    
    for (const style of styles) {
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

        const captionText = completion.choices[0]?.message?.content?.trim() || '';
        
        if (captionText) {
          productCaptions.push({
            style,
            text: captionText
          });
        }
      } catch (error) {
        console.error(`Error generating ${style} caption for ${product.name}:`, error);
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
  storeName: string
): Promise<Array<{ product: ShopifyProduct; captions: Array<{ style: CaptionStyle; text: string }> }>> {
  // Generate only first 3 caption styles for preview
  const previewStyles: CaptionStyle[] = ['product_showcase', 'benefits_focused', 'social_proof'];
  return generateCaptions(products.slice(0, 1), storeName, previewStyles); // Only first product, first 3 styles
}