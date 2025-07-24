import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createAuthError } from '@/lib/auth-middleware';

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
  // Extract business name (usually in title or h1)
  const titleMatch = content.match(/title":"([^"]+)"|# ([^#\n]+)/);
  let businessName = titleMatch ? (titleMatch[1] || titleMatch[2]) : 'Business';
  
  // Clean up business name - remove extra info
  businessName = businessName.split('|')[0].trim();
  businessName = businessName.replace(/\s*-\s*.*$/, '').trim();

  // Extract location - look for various patterns
  let location = 'Location';
  
  // Try to find address in various formats
  const addressPatterns = [
    /(\d+[^,]*,\s*[^,]+,\s*[^,]+,\s*[^,]+)/i, // Full address format
    /Sector\s*\d+[^,]*,[^,]+/i, // Sector based addresses
    /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|sector|market)[^,]*,[^,]+)/i,
    /Address[:\s-]+([^\n]+)/i // Address label
  ];
  
  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match) {
      location = match[0].replace(/Address[:\s-]+/i, '').trim();
      break;
    }
  }

  // Auto-detect service category from content
  const category = autoDetectServiceCategory(content);
  
  // Extract services based on detected category
  const services = extractServices(content, category);

  // Extract target audience hints
  const targetAudience = extractTargetAudience(content);

  return {
    businessName: businessName.substring(0, 100), // Limit length
    location: location.substring(0, 200),
    category,
    services,
    targetAudience
  };
}

function extractServices(content: string, category: string): string[] {
  const services: Set<string> = new Set();
  
  // Enhanced service extraction from navigation/menu links
  const menuPattern = /\[([^\]]+)\]\(https?:\/\/[^)]+\/([\w-]+)\/?\)/g;
  let menuMatch;
  while ((menuMatch = menuPattern.exec(content)) !== null) {
    const serviceName = menuMatch[1];
    const urlSlug = menuMatch[2];
    
    // Filter out non-service links with expanded exclusions
    const excludeTerms = ['home', 'about', 'contact', 'blog', 'privacy', 'terms', 'career', 'courses', 'appointment', 'book'];
    if (!excludeTerms.some(term => urlSlug.toLowerCase().includes(term))) {
      // Clean up service names more thoroughly
      const cleanedService = serviceName
        .replace(/Menu Toggle/gi, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanedService.length > 3 && cleanedService.length < 50 && !cleanedService.match(/^(Home|About|Contact)$/i)) {
        services.add(cleanedService);
      }
    }
  }
  
  // Extract services from menu structures (like nested menus)
  const nestedMenuPattern = /\*\s+\[([^\]]+)\]\([^)]+\)/g;
  let nestedMatch;
  while ((nestedMatch = nestedMenuPattern.exec(content)) !== null) {
    const serviceName = nestedMatch[1];
    const cleanedService = serviceName
      .replace(/Menu Toggle/gi, '')
      .trim();
    
    if (cleanedService.length > 3 && cleanedService.length < 50 && !cleanedService.match(/^(Home|About|Contact)$/i)) {
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

  // Category-specific service extraction for health/medical
  if (category === 'health_medical' || category === 'salon_spa') {
    // Look for treatment patterns
    const treatmentPattern = /(\w+\s+)?(?:treatment|therapy|procedure|facial|peel|laser|reduction|hair|skin|anti[- ]?aging|rejuvenation|lifting|brightening|pigmentation|acne|scar)(?:\s+\w+)?/gi;
    const matches = content.match(treatmentPattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.trim();
        if (cleaned.length > 5 && cleaned.length < 50) {
          services.add(cleaned);
        }
      });
    }
  }

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

  // Shuffle the services array to avoid bias towards first items
  const shuffledServices = servicesArray.sort(() => 0.5 - Math.random());
  
  // console.log('Extracted services:', shuffledServices); // Debug log
  
  // Return top 10 services (more comprehensive list)
  return shuffledServices.slice(0, 10);
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