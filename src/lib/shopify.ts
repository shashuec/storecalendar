import { ShopifyProduct } from '@/types';

export async function scrapeShopifyStore(url: string): Promise<{
  storeName: string;
  products: ShopifyProduct[];
}> {
  try {
    // Normalize URL
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const shopifyUrl = `https://${cleanUrl}`;
    
    // Fetch products.json (Shopify's public API)
    const productsResponse = await fetch(`${shopifyUrl}/products.json?limit=10`);
    
    if (!productsResponse.ok) {
      if (productsResponse.status === 404) {
        throw new Error('This URL does not appear to be a Shopify store. Please check the URL.');
      } else if (productsResponse.status === 401 || productsResponse.status === 403) {
        throw new Error('This store is password protected or private. Please make it public temporarily.');
      } else {
        throw new Error(`Unable to fetch store data (${productsResponse.status}). Please check the URL.`);
      }
    }
    
    const productsData = await productsResponse.json();
    
    if (!productsData.products || productsData.products.length === 0) {
      throw new Error('No products found in this store.');
    }
    
    // Extract store name from first request or use domain
    const storeName = cleanUrl.split('.')[0] || 'Store';
    
    // Transform products
    const products: ShopifyProduct[] = productsData.products.slice(0, 10).map((product: {
      id: number;
      title: string;
      body_html?: string;
      variants: Array<{ price: string }>;
      images: Array<{ src: string }>;
    }) => ({
      id: product.id.toString(),
      name: product.title,
      description: product.body_html?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      price: product.variants[0]?.price || '0',
      image_url: product.images[0]?.src || ''
    }));
    
    return {
      storeName: storeName.charAt(0).toUpperCase() + storeName.slice(1),
      products
    };
    
  } catch (error) {
    console.error('Shopify scraping error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch store data');
  }
}

export async function validateShopifyUrl(url: string): Promise<boolean> {
  try {
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Basic URL format validation
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanUrl)) {
      return false;
    }
    
    // Test if it's actually a Shopify store by checking products.json
    const testUrl = `https://${cleanUrl}/products.json?limit=1`;
    const response = await fetch(testUrl, { 
      method: 'HEAD', // Just check if endpoint exists
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

// Keep synchronous version for basic format checking
export function validateShopifyUrlFormat(url: string): boolean {
  try {
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Accept any properly formatted domain
    // Could be .myshopify.com, custom domain, or any domain with Shopify
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanUrl);
  } catch {
    return false;
  }
}