import { ShopifyProductEnhanced } from '@/types';

export interface RankingCriteria {
  name: string;
  weight: number;
  scoreFunction: (product: ShopifyProductEnhanced) => number;
}

// Default ranking criteria for bestsellers
export const DEFAULT_RANKING_CRITERIA: RankingCriteria[] = [
  {
    name: 'position',
    weight: 0.4, // 40% - Shopify's default order often reflects sales
    scoreFunction: (product) => Math.max(0, 100 - (product.rank || 1))
  },
  {
    name: 'price_appeal',
    weight: 0.3, // 30% - Mid-range prices tend to sell better
    scoreFunction: (product) => {
      const price = parseFloat(product.price) || 0;
      if (price === 0) return 0;
      // Sweet spot between $10-$100 gets highest score
      if (price >= 10 && price <= 100) return 100;
      if (price < 10) return Math.min(price * 10, 80);
      if (price > 100) return Math.max(20, 100 - (price - 100) / 10);
      return 50;
    }
  },
  {
    name: 'title_quality',
    weight: 0.2, // 20% - Good titles indicate professional listings
    scoreFunction: (product) => {
      if (!product.name) return 0; // Return 0 if no name
      const title = product.name.toLowerCase();
      let score = 50; // Base score
      
      // Bonus for good length (3-8 words)
      const wordCount = title.split(' ').length;
      if (wordCount >= 3 && wordCount <= 8) score += 20;
      
      // Bonus for descriptive words
      const descriptiveWords = ['premium', 'quality', 'best', 'professional', 'luxury'];
      if (descriptiveWords.some(word => title.includes(word))) score += 15;
      
      // Penalty for excessive caps or special chars
      if (title === title.toUpperCase()) score -= 20;
      if (/[!@#$%^&*()]{2,}/.test(title)) score -= 15;
      
      return Math.max(0, Math.min(100, score));
    }
  },
  {
    name: 'completeness',
    weight: 0.1, // 10% - Complete product info suggests better performance
    scoreFunction: (product) => {
      let score = 0;
      if (product.description && product.description.length > 20) score += 30;
      if (product.image_url) score += 30;
      if (product.product_type && product.product_type !== 'General') score += 20;
      if (product.vendor) score += 10;
      if (product.tags && product.tags.length > 0) score += 10;
      return score;
    }
  }
];

// Calculate ranking score for a product
export function calculateProductScore(
  product: ShopifyProductEnhanced, 
  criteria: RankingCriteria[] = DEFAULT_RANKING_CRITERIA
): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const criterion of criteria) {
    const score = criterion.scoreFunction(product);
    totalScore += score * criterion.weight;
    totalWeight += criterion.weight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// Rank products by their calculated scores
export function rankProducts(
  products: ShopifyProductEnhanced[],
  criteria: RankingCriteria[] = DEFAULT_RANKING_CRITERIA
): ShopifyProductEnhanced[] {
  return products
    .map(product => ({
      ...product,
      score: calculateProductScore(product, criteria)
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((product, index) => ({
      ...product,
      rank: index + 1
    }));
}

// Auto-select top N products
export function autoSelectTopProducts(
  rankedProducts: ShopifyProductEnhanced[],
  count: number = 5
): ShopifyProductEnhanced[] {
  return rankedProducts.map((product, index) => ({
    ...product,
    selected: index < count
  }));
}

// Get products by category/type for variety
export function getProductsByType(products: ShopifyProductEnhanced[]): Record<string, ShopifyProductEnhanced[]> {
  const grouped: Record<string, ShopifyProductEnhanced[]> = {};
  
  for (const product of products) {
    const type = product.product_type || 'General';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(product);
  }
  
  return grouped;
}

// Smart selection ensuring variety across product types
export function smartSelectProducts(
  products: ShopifyProductEnhanced[],
  count: number = 5
): ShopifyProductEnhanced[] {
  const rankedProducts = rankProducts(products);
  const productsByType = getProductsByType(rankedProducts);
  const types = Object.keys(productsByType);
  
  // If only one type or few products, use simple auto-select
  if (types.length <= 2 || products.length <= count) {
    return autoSelectTopProducts(rankedProducts, count);
  }
  
  // Smart selection: pick best from each type
  const selected: ShopifyProductEnhanced[] = [];
  const productsPerType = Math.floor(count / types.length);
  const remainder = count % types.length;
  
  // Select products from each type
  for (let i = 0; i < types.length && selected.length < count; i++) {
    const typeProducts = productsByType[types[i]];
    const takeCount = productsPerType + (i < remainder ? 1 : 0);
    selected.push(...typeProducts.slice(0, takeCount));
  }
  
  // Fill remaining slots with highest-ranked products
  if (selected.length < count) {
    const selectedIds = new Set(selected.map(p => p.id));
    const remaining = rankedProducts.filter(p => !selectedIds.has(p.id));
    selected.push(...remaining.slice(0, count - selected.length));
  }
  
  // Mark as selected and return all products with selection status
  const selectedIds = new Set(selected.map(p => p.id));
  return rankedProducts.map(product => ({
    ...product,
    selected: selectedIds.has(product.id)
  }));
}

// Filter products by search query
export function filterProductsByQuery(
  products: ShopifyProductEnhanced[],
  query: string
): ShopifyProductEnhanced[] {
  if (!query.trim()) return products;
  
  const searchTerm = query.toLowerCase().trim();
  
  return products.filter(product => {
    return (
      product.name?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.product_type?.toLowerCase().includes(searchTerm) ||
      product.vendor?.toLowerCase().includes(searchTerm) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  });
}

// Get product type suggestions for filtering
export function getProductTypeSuggestions(products: ShopifyProductEnhanced[]): string[] {
  const types = new Set<string>();
  
  for (const product of products) {
    if (product.product_type && product.product_type !== 'General') {
      types.add(product.product_type);
    }
  }
  
  return Array.from(types).sort();
}