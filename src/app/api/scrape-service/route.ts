import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createAuthError } from '@/lib/auth-middleware';
import { cleanAndMergeServices } from '@/lib/service-cleaning';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        createAuthError('Please sign in to continue'),
        { status: 401 }
      );
    }

    

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Use Jina AI to scrape the business website
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    
    const jinaResponse = await fetch(jinaUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'markdown',
      }
    });

    if (!jinaResponse.ok) {
      throw new Error('Failed to scrape website');
    }

    const content = await jinaResponse.text();

    // Extract business information from scraped content with auto-detected category
    const businessInfo = extractBusinessInfo(content);

    // Check if no services were found
    if (!businessInfo.services || businessInfo.services.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No services found on this website. Please ensure the URL contains a services page or try a different URL.',
        businessName: businessInfo.businessName,
        category: businessInfo.category
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...businessInfo,
      scrapedContent: content // Include the raw scraped content
    });

  } catch (error) {
    console.error('Service scraping error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape business information';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

function extractBusinessInfo(content: string) {
  // Extract business name from various sources
  let businessName = 'Business';
  
  // Try JSON format first (like your example)
  const jsonTitleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  if (jsonTitleMatch) {
    businessName = jsonTitleMatch[1];
  } else {
    // Try markdown title or h1
    const titleMatch = content.match(/^#\s+([^#\n]+)|<h1[^>]*>([^<]+)<\/h1>/im);
    if (titleMatch) {
      businessName = titleMatch[1] || titleMatch[2];
    }
  }
  
  // Clean up business name - remove SEO additions
  businessName = businessName
    .split('|')[0] // Remove everything after pipe
    .split('-')[0] // Remove everything after first dash (often contains location/SEO)
    .replace(/\s*(Best|Top|in|near|at)\s+.*/i, '') // Remove "Best ... in City" type additions
    .replace(/\s*&\s*/, ' & ') // Clean up ampersands
    .trim();

  // Auto-detect service category from content
  const category = autoDetectServiceCategory(content);
  
  // Extract services based on detected category
  const services = extractServices(content, category);

  // Extract target audience hints
  const targetAudience = extractTargetAudience(content);

  return {
    businessName: businessName.substring(0, 100), // Limit length
    category,
    services,
    targetAudience
  };
}

function extractServices(content: string, category: string): string[] {
  const services: Set<string> = new Set();
  
  // === START: UNIVERSAL_SERVICE_EXTRACTION_FIX ===
  // Enhanced exclusion list for generic CTAs and navigation
  const excludePhrases = [
    'explore services', 'our services', 'view services', 'see services',
    'learn more', 'read more', 'find out', 'discover more',
    'get started', 'book now', 'contact us', 'call us',
    'click here', 'see all', 'view all', 'show more',
    'services', 'service', 'offerings', 'solutions'
  ];
  
  // Function to check if a string is a generic CTA or navigation
  const isGenericCTA = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    return excludePhrases.some(phrase => 
      lower === phrase || 
      lower.startsWith(phrase + ' ') ||
      lower.endsWith(' ' + phrase)
    );
  };
  
  // Enhanced service extraction from navigation/menu links
  const menuPattern = /\[([^\]]+)\]\(https?:\/\/[^)]+\/([\w-]+)\/?\)/g;
  let menuMatch;
  while ((menuMatch = menuPattern.exec(content)) !== null) {
    const serviceName = menuMatch[1];
    const urlSlug = menuMatch[2];
    
    // Skip if it's a generic CTA
    if (isGenericCTA(serviceName)) continue;
    
    // Filter out non-service links with expanded exclusions
    const excludeTerms = ['home', 'about', 'contact', 'blog', 'privacy', 'terms', 'career', 'courses', 'appointment', 'book', 'explore', 'services'];
    if (!excludeTerms.some(term => urlSlug.toLowerCase().includes(term))) {
      // Clean up service names more thoroughly
      const cleanedService = serviceName
        .replace(/Menu Toggle/gi, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanedService.length > 3 && cleanedService.length < 50 && 
          !cleanedService.match(/^(Home|About|Contact|Services|Explore)$/i) &&
          !isGenericCTA(cleanedService)) {
        services.add(cleanedService);
      }
    }
  }
  // === END: UNIVERSAL_SERVICE_EXTRACTION_FIX ===
  
  // Extract services from menu structures (like nested menus)
  const nestedMenuPattern = /\*\s+\[([^\]]+)\]\([^)]+\)/g;
  let nestedMatch;
  while ((nestedMatch = nestedMenuPattern.exec(content)) !== null) {
    const serviceName = nestedMatch[1];
    
    // === UNIVERSAL_SERVICE_EXTRACTION_FIX: Apply same filtering ===
    if (isGenericCTA(serviceName)) continue;
    
    const cleanedService = serviceName
      .replace(/Menu Toggle/gi, '')
      .trim();
    
    if (cleanedService.length > 3 && cleanedService.length < 50 && 
        !cleanedService.match(/^(Home|About|Contact|Services|Explore)$/i) &&
        !isGenericCTA(cleanedService)) {
      services.add(cleanedService);
    }
  }

  // Also look for services in heading patterns
  const headingPattern = /###?\s+([A-Z][A-Za-z\s&-]+)(?:\n|$)/g;
  let headingMatch;
  while ((headingMatch = headingPattern.exec(content)) !== null) {
    const service = headingMatch[1].trim();
    if (service.length > 3 && service.length < 50 && !service.match(/^(About|Contact|Home|Blog)/i)) {
      services.add(service);
    }
  }

  // === UNIVERSAL_SERVICE_EXTRACTION_FIX: Enhanced service patterns ===
  // Look for services in list patterns (bullets, numbers, etc.)
  const listPatterns = [
    /(?:^|\n)\s*[•·▪▸→]\s*([A-Za-z][A-Za-z\s&'-]+?)(?=\n|$)/gm,
    /(?:^|\n)\s*\d+\.\s*([A-Za-z][A-Za-z\s&'-]+?)(?=\n|$)/gm,
    /(?:^|\n)\s*[-*]\s*([A-Za-z][A-Za-z\s&'-]+?)(?=\n|$)/gm
  ];
  
  listPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const service = match[1].trim();
      if (service.length > 5 && service.length < 50 && !isGenericCTA(service)) {
        services.add(service);
      }
    }
  });
  
  // Category-specific service extraction
  const servicePatterns = {
    'health_medical': /(\w+\s+)?(?:treatment|therapy|procedure|consultation|surgery|examination|screening|diagnosis|care)(?:\s+\w+)?/gi,
    'salon_spa': /(\w+\s+)?(?:facial|peel|laser|hair|manicure|pedicure|massage|waxing|threading|coloring|styling|makeup)(?:\s+\w+)?/gi,
    'gym_fitness': /(\w+\s+)?(?:training|workout|class|yoga|pilates|zumba|crossfit|cardio|strength|bootcamp|fitness)(?:\s+\w+)?/gi,
    'food_dining': /(\w+\s+)?(?:catering|delivery|takeout|dining|buffet|party|event|special)(?:\s+\w+)?/gi,
    'professional_services': /(\w+\s+)?(?:consulting|audit|legal|accounting|advisory|analysis|management|design|development)(?:\s+\w+)?/gi,
    'other': /(\w+\s+)?(?:service|repair|installation|maintenance|support|solution|package|program|plan)(?:\s+\w+)?/gi
  };
  
  const categoryPattern = servicePatterns[category as keyof typeof servicePatterns] || servicePatterns['other'];
  const matches = content.match(categoryPattern);
  if (matches) {
    matches.forEach(match => {
      const cleaned = match.trim();
      if (cleaned.length > 5 && cleaned.length < 50 && !isGenericCTA(cleaned)) {
        services.add(cleaned);
      }
    });
  }
  // === END: UNIVERSAL_SERVICE_EXTRACTION_FIX ===

  // Convert Set to Array and return top services
  let servicesArray = Array.from(services);
  
  // If we found services from navigation, prioritize those
  if (servicesArray.length === 0) {
    // Fallback to generic extraction
    const genericPattern = /(?:we offer|our services include|specializing in|we provide)\s*:?\s*([^.]+)/gi;
    let genericMatch;
    while ((genericMatch = genericPattern.exec(content)) !== null) {
      const serviceList = genericMatch[1].split(/[,;]/);
      serviceList.forEach(s => {
        const cleaned = s.trim();
        if (cleaned.length > 3 && cleaned.length < 50) {
          services.add(cleaned);
        }
      });
    }
    servicesArray = Array.from(services);
  }

  // Don't shuffle - keep the order for consistency
  // console.log('Raw extracted services:', servicesArray); // Debug log
  // console.log('Total raw services found:', servicesArray.length);
  
  // Clean and merge services using the new cleaning utility
  const cleanedServices = cleanAndMergeServices(servicesArray);
  // console.log('Cleaned services:', cleanedServices);
  // console.log('Total cleaned services:', cleanedServices.length);
  
  // Return cleaned services
  return cleanedServices;
}

function autoDetectServiceCategory(content: string): string {
  const lowerContent = content.toLowerCase();
  
  // Health & Medical indicators
  const healthKeywords = [
    'dermat', 'skin', 'clinic', 'doctor', 'medical', 'treatment', 'therapy', 'health',
    'facial', 'laser', 'botox', 'cosmetic', 'aesthetic', 'surgery', 'dentist', 'dental'
  ];
  
  // Salon & Spa indicators
  const salonKeywords = [
    'salon', 'spa', 'beauty', 'hair', 'nail', 'massage', 'facial', 'makeup', 
    'eyebrow', 'lash', 'pedicure', 'manicure', 'wax', 'styling'
  ];
  
  // Gym & Fitness indicators
  const fitnessKeywords = [
    'gym', 'fitness', 'workout', 'training', 'exercise', 'yoga', 'pilates',
    'crossfit', 'personal trainer', 'weight', 'muscle', 'cardio'
  ];
  
  // Food & Dining indicators
  const foodKeywords = [
    'restaurant', 'cafe', 'food', 'dining', 'menu', 'cuisine', 'chef', 'catering',
    'bakery', 'bar', 'pizza', 'delivery', 'takeout'
  ];
  
  // Professional Services indicators
  const professionalKeywords = [
    'consulting', 'legal', 'law', 'accounting', 'financial', 'insurance',
    'real estate', 'marketing', 'design', 'photography', 'lawyer', 'attorney'
  ];
  
  // Count matches for each category
  const healthScore = healthKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  const salonScore = salonKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  const fitnessScore = fitnessKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  const foodScore = foodKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  const professionalScore = professionalKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  
  
  // Return category with highest score
  const scores = {
    'health_medical': healthScore,
    'salon_spa': salonScore,
    'gym_fitness': fitnessScore,
    'food_dining': foodScore,
    'professional_services': professionalScore
  };
  
  const maxCategory = Object.entries(scores).reduce((a, b) => scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b)[0];
  
  // If no clear winner or very low scores, default to 'other'
  const maxScore = scores[maxCategory as keyof typeof scores];
  if (maxScore < 2) {
    return 'other';
  }
  
  return maxCategory;
}

function extractTargetAudience(content: string): string {
  // Look for audience indicators
  if (content.match(/luxury|premium|exclusive/i)) {
    return 'Affluent professionals seeking premium services';
  } else if (content.match(/family|kids|children/i)) {
    return 'Families and parents';
  } else if (content.match(/young|trendy|modern/i)) {
    return 'Young professionals and trendsetters';
  } else if (content.match(/senior|elderly|mature/i)) {
    return 'Mature adults and seniors';
  }
  
  return 'General audience seeking quality services';
}