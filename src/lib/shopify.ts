import { ShopifyProduct, ShopifyProductEnhanced } from '@/types';

export async function scrapeShopifyStore(url: string, limit: number = 50): Promise<{
  storeName: string;
  products: ShopifyProductEnhanced[];
}> {
  try {
    // Normalize URL - remove protocol, trailing slash, and query parameters
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const domainPart = cleanUrl.split('?')[0].split('/')[0];
    const shopifyUrl = `https://${domainPart}`;
    
    // Fetch products.json with higher limit (max 250 per request)
    const requestLimit = Math.min(limit, 250);
    const productsResponse = await fetch(`${shopifyUrl}/products.json?limit=${requestLimit}`);
    
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
    const storeName = domainPart.split('.')[0] || 'Store';
    
    // Transform products with enhanced metadata
    const products: ShopifyProductEnhanced[] = productsData.products.slice(0, limit).map((product: {
      id: number;
      title: string;
      handle?: string;
      body_html?: string;
      variants: Array<{ price: string; inventory_quantity?: number }>;
      images: Array<{ src: string }>;
      product_type?: string;
      vendor?: string;
      tags?: string;
      created_at?: string;
    }, index: number) => ({
      id: product.id.toString(),
      name: product.title,
      description: product.body_html?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      price: product.variants[0]?.price || '0',
      image_url: product.images[0]?.src || '',
      url: product.handle ? `https://${domainPart}/products/${product.handle}` : `https://${domainPart}/products/${product.id}`,
      handle: product.handle || '',
      // Enhanced fields
      selected: false, // Default unselected
      rank: index + 1, // Position in original list (for ranking)
      product_type: product.product_type || 'General',
      vendor: product.vendor || '',
      tags: product.tags && typeof product.tags === 'string' ? product.tags.split(',').map(tag => tag.trim()) : []
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
    const domainPart = cleanUrl.split('?')[0].split('/')[0];
    
    // Basic URL format validation
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainPart)) {
      return false;
    }
    
    // Test if it's actually a Shopify store by checking products.json
    const testUrl = `https://${domainPart}/products.json?limit=1`;
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
    
    // Extract just the domain part (before query parameters or paths)
    const domainPart = cleanUrl.split('?')[0].split('/')[0];
    
    // Accept any properly formatted domain
    // Could be .myshopify.com, custom domain, or any domain with Shopify
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainPart);
  } catch {
    return false;
  }
}