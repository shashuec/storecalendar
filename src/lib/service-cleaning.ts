interface CleanedService {
  name: string;
  variations: string[];
  score: number;
}

export function cleanAndMergeServices(rawServices: string[]): string[] {
  // Stage 1: Initial cleaning
  const cleaned = rawServices.map(service => cleanServiceName(service));
  
  // Stage 2: Remove duplicates and fragments
  const deduped = removeDuplicatesAndFragments(cleaned);
  
  // Stage 3: Merge similar services
  const merged = mergeSimilarServices(deduped);
  
  // Stage 4: Score and rank
  const ranked = rankServices(merged);
  
  // Return top services (max 10)
  return ranked.slice(0, 10).map(s => s.name);
}

function cleanServiceName(service: string): string {
  return service
    // Remove special characters at start
    .replace(/^[n\s\-•·]+/, '')
    // Remove prices and offers
    .replace(/₹\d+|Rs\.?\s*\d+|\$\d+|FREE|Off/gi, '')
    // Remove CTAs and arrows
    .replace(/→|Take Quiz|View Details|Get Started|Book Now|Take Free/gi, '')
    // Remove generic words that don't add value
    .replace(/\b(your|unique|expert|minute|naturally|popular)\b/gi, '')
    // Remove standalone 'treatment' or 'service'
    .replace(/^(treatment|service)$/gi, '')
    // Remove numbers at start (like "2-Min")
    .replace(/^\d+-?(min|minute)?\s*/i, '')
    // Fix spacing
    .replace(/\s+/g, ' ')
    .trim();
}

function removeDuplicatesAndFragments(services: string[]): string[] {
  // Filter out empty strings first
  const nonEmpty = services.filter(s => s && s.length > 0);
  
  // === UNIVERSAL_SERVICE_EXTRACTION_FIX: Enhanced blacklist ===
  // Remove obvious non-services
  const blacklist = [
    'about us', 'sitemap', 'contact', 'home', 'blog', 'services',
    'quiz', 'assessment', 'consultation', 'minute', 'min',
    'details', 'naturally', 'popular', 'view', 'treatments',
    'get', 'take', 'free', 'off', 'treatment', 'service',
    // Additional generic CTAs and navigation
    'explore', 'learn more', 'read more', 'find out',
    'discover', 'see all', 'view all', 'our services',
    'explore services', 'explore our services', 'know more',
    'get started', 'book now', 'contact us', 'call us','Forgot Password?'
  ];
  
  const filtered = nonEmpty.filter(service => {
    // Remove empty or too short
    if (!service || service.length < 3) return false;
    
    // Remove blacklisted terms
    const lower = service.toLowerCase().trim();
    if (blacklist.includes(lower)) return false;
    
    // Remove if it's just numbers or special chars
    if (/^[\d\s\-]+$/.test(service)) return false;
    
    return true;
  });
  
  // Remove fragments (services that are substrings of others)
  return filtered.filter(service => {
    const lower = service.toLowerCase();
    
    // Check if this service is a meaningful substring of another
    const isFragment = filtered.some(other => {
      if (other === service) return false;
      const otherLower = other.toLowerCase();
      
      // If this service is contained in another and the other is significantly longer
      if (otherLower.includes(lower) && other.length > service.length + 5) {
        // But keep it if it's a known standalone service
        const standaloneServices = ['facial', 'peel', 'botox', 'laser'];
        return !standaloneServices.some(s => lower.includes(s));
      }
      
      return false;
    });
    
    return !isFragment;
  });
}

function mergeSimilarServices(services: string[]): CleanedService[] {
  const serviceGroups: Map<string, CleanedService> = new Map();
  
  services.forEach(service => {
    const key = generateServiceKey(service);
    const formattedName = formatServiceName(service);
    
    if (serviceGroups.has(key)) {
      // Add as variation
      const group = serviceGroups.get(key)!;
      if (!group.variations.includes(service)) {
        group.variations.push(service);
        // Update name if this variation is better formatted
        if (formattedName.length > group.name.length || 
            (formattedName.match(/[A-Z]/g) || []).length > (group.name.match(/[A-Z]/g) || []).length) {
          group.name = formattedName;
        }
      }
    } else {
      // Create new group
      serviceGroups.set(key, {
        name: formattedName,
        variations: [service],
        score: 0
      });
    }
  });
  
  return Array.from(serviceGroups.values());
}

function generateServiceKey(service: string): string {
  // Create a key for grouping similar services
  const lower = service.toLowerCase();
  
  // Known service mappings - map variations to canonical names
  const mappings: Record<string, string[]> = {
    'laser_hair_removal': ['laser hair', 'hair removal', 'permanent hair', 'laser removal'],
    'chemical_peel': ['chemical peel', 'peel', 'peeling', 'skin peel'],
    'hydrafacial': ['hydrafacial', 'hydra facial', 'hydra-facial'],
    'facial': ['facial', 'face treatment', 'face care'],
    'acne_treatment': ['acne', 'clear skin', 'pimple', 'acne treatment'],
    'anti_aging': ['anti-aging', 'antiaging', 'anti aging', 'botox', 'wrinkle'],
    'prp_hair': ['prp hair', 'prp treatment', 'platelet rich', 'hair restoration'],
    'skin_assessment': ['skin assessment', 'skin analysis', 'skin consultation']
  };
  
  // Check each mapping
  for (const [key, patterns] of Object.entries(mappings)) {
    if (patterns.some(p => lower.includes(p))) {
      return key;
    }
  }
  
  // Default: use cleaned version as key
  return lower
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join('_');
}

function rankServices(services: CleanedService[]): CleanedService[] {
  return services.map(service => {
    let score = 0;
    
    // Base score from variations count (more variations = more mentions = more important)
    score += Math.min(service.variations.length * 5, 20);
    
    // Known high-value services get bonus points
    const highValueServices = [
      'laser hair removal', 'chemical peel', 'hydrafacial',
      'botox', 'anti-aging', 'anti aging', 'prp', 'acne treatment', 
      'facial', 'microneedling', 'dermal filler'
    ];
    
    const nameLower = service.name.toLowerCase();
    if (highValueServices.some(s => nameLower.includes(s))) {
      score += 25;
    }
    
    // Proper formatting bonus (Title Case)
    if (service.name.match(/^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/)) {
      score += 10;
    }
    
    // Specific service bonus (not generic)
    if (service.name.split(' ').length >= 2 && service.name.split(' ').length <= 4) {
      score += 15;
    }
    
    // Length penalty (too short or too long)
    if (service.name.length < 5) {
      score -= 10;
    } else if (service.name.length > 30) {
      score -= 5;
    }
    
    // Contains action/service words
    const serviceWords = ['treatment', 'therapy', 'removal', 'restoration', 'rejuvenation'];
    if (serviceWords.some(word => nameLower.includes(word))) {
      score += 5;
    }
    
    service.score = score;
    return service;
  }).sort((a, b) => b.score - a.score);
}

function formatServiceName(service: string): string {
  // Special formatting rules for acronyms and specific terms
  const specialCases: Record<string, string> = {
    'prp': 'PRP',
    'hydrafacial': 'HydraFacial',
    'ipl': 'IPL',
    'co2': 'CO2',
    'rf': 'RF',
    'led': 'LED',
    'hifu': 'HIFU'
  };
  
  // Split and process each word
  const words = service.split(' ').filter(word => word.length > 0);
  
  const formatted = words.map((word, index) => {
    const lower = word.toLowerCase();
    
    // Check special cases
    if (specialCases[lower]) {
      return specialCases[lower];
    }
    
    // Handle hyphenated words
    if (word.includes('-')) {
      return word.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-');
    }
    
    // Regular title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  return formatted.join(' ');
}

// Export additional utility functions for testing
export { cleanServiceName, formatServiceName };