import { ServiceBusiness, WeeklyCalendar, CalendarPost, Holiday } from '@/types';
import { generateServiceCaption } from '@/lib/openai';

// Service-specific post types - 7 days for each category
const SERVICE_POST_TYPES = {
  salon_spa: [
    'Monday Makeover',           // Monday
    'Transformation Tuesday',     // Tuesday
    'Wellness Wednesday',         // Wednesday
    'Treatment Thursday',         // Thursday
    'Feature Friday',            // Friday
    'Saturday Style',            // Saturday
    'Self-Care Sunday'           // Sunday
  ],
  gym_fitness: [
    'Motivation Monday',         // Monday
    'Training Tuesday',          // Tuesday
    'Workout Wednesday',         // Wednesday
    'Transformation Thursday',   // Thursday
    'Fitness Friday',           // Friday
    'Saturday Sweat',           // Saturday
    'Sunday Stretch'            // Sunday
  ],
  food_dining: [
    'Menu Monday',              // Monday
    'Tasty Tuesday',            // Tuesday
    'What\'s Cooking Wednesday', // Wednesday
    'Thirsty Thursday',         // Thursday
    'Feature Friday',           // Friday
    'Saturday Special',         // Saturday
    'Sunday Brunch'             // Sunday
  ],
  health_medical: [
    'Medical Monday',           // Monday
    'Treatment Tuesday',        // Tuesday
    'Wellness Wednesday',       // Wednesday
    'Therapy Thursday',         // Thursday
    'Facts Friday',             // Friday
    'Saturday Services',        // Saturday
    'Sunday Health Tips'        // Sunday
  ],
  professional_services: [
    'Monday Motivation',        // Monday
    'Tips Tuesday',             // Tuesday
    'Work Wednesday',           // Wednesday
    'Throwback Thursday',       // Thursday
    'Feature Friday',           // Friday
    'Saturday Solutions',       // Saturday
    'Sunday Summary'            // Sunday
  ],
  other: [
    'Monday Spotlight',         // Monday
    'Tuesday Tips',             // Tuesday
    'Wednesday Wisdom',         // Wednesday
    'Thursday Thoughts',        // Thursday
    'Feature Friday',           // Friday
    'Saturday Special',         // Saturday
    'Sunday Showcase'           // Sunday
  ]
};

// Get the next 7 days
function getNext7Days(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Get day name from date
function getDayName(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00Z');
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

// Extract which service was featured in the caption
function extractFeaturedService(caption: string, availableServices: string[]): string | null {
  const lowerCaption = caption.toLowerCase();
  
  // Find the service that appears in the caption
  for (const service of availableServices) {
    const lowerService = service.toLowerCase();
    if (lowerCaption.includes(lowerService)) {
      return service;
    }
    
    // Also check for partial matches (e.g., "Laser" for "Laser Hair Reduction")
    const serviceWords = lowerService.split(' ');
    if (serviceWords.some(word => word.length > 3 && lowerCaption.includes(word))) {
      return service;
    }
  }
  
  return null;
}

// Generate weekly calendar for service business
export async function generateServiceContent(
  business: ServiceBusiness,
  weekNumber: 1 | 2,
  holidays: Holiday[]
): Promise<WeeklyCalendar> {
  // Log all services available vs selected
  console.log('Service generation - All services:', business.services);
  console.log('Service generation - Selected services count:', business.services.length);
  const dates = getNext7Days();
  const startDate = dates[0];
  const endDate = dates[6];
  
  // Create holiday map by date
  const holidayMap = new Map<string, Holiday>();
  holidays.forEach(holiday => {
    holidayMap.set(holiday.date, holiday);
  });
  
  // Get post types for this business category
  const postTypes = SERVICE_POST_TYPES[business.category] || SERVICE_POST_TYPES.other;
  
  // Shuffle only the selected services to ensure variety across the week
  // Note: business.services should already contain only the selected services
  const shuffledServices = [...business.services].sort(() => 0.5 - Math.random());
  console.log('Using services for calendar:', shuffledServices);
  
  // Generate posts for each day
  const posts: CalendarPost[] = [];
  const usedServices: string[] = []; // Track used services to avoid repetition
  
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const dayName = getDayName(date);
    
    // Map day name to correct index (0 = Monday, 6 = Sunday)
    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(dayName);
    const postType = postTypes[dayIndex];
    const holiday = holidayMap.get(date);
    
    // Select specific service for this day to avoid repetition
    const availableServices = shuffledServices.filter(service => !usedServices.includes(service));
    const selectedService = availableServices.length > 0 ? availableServices[0] : shuffledServices[i % shuffledServices.length];
    
    // Create a modified business object with service context for this day
    const businessWithContext = {
      ...business,
      services: business.services, // Use only selected services
      allServices: shuffledServices, // For variety
      usedServices: [...usedServices], // Pass previously used services
      selectedService, // Pass the specific service for this day
      focusOnSelectedServices: true // Flag to ensure AI focuses only on selected services
    };
    
    // Generate caption using AI
    const captionText = await generateServiceCaption(
      businessWithContext,
      postType,
      dayName,
      holiday
    );
    
    // Track this service as used
    if (!usedServices.includes(selectedService)) {
      usedServices.push(selectedService);
    }
    
    const post: CalendarPost = {
      id: `service-${date}-${i}-${Date.now()}`, // Dummy ID using date and timestamp
      day: dayName,
      date,
      post_type: postType,
      caption_text: captionText,
      product_featured: {
        id: 'service',
        name: business.businessName,
        description: `Featured service: ${selectedService || business.services[0]}`,
        price: '',
        image_url: '',
        url: business.website || ''
      },
      holiday_context: holiday
    };
    
    posts.push(post);
  }
  
  return {
    week_number: weekNumber,
    start_date: startDate,
    end_date: endDate,
    posts,
    country: 'US', // Default to US for now
    brand_tone: business.brandVoice,
    selected_products: [] // No products for service businesses
  };
}