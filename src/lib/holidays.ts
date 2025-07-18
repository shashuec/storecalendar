export type CountryCode = 'US' | 'UK' | 'IN';

export type HolidayType = 
  | 'celebration' 
  | 'gift-giving' 
  | 'shopping' 
  | 'patriotic' 
  | 'festival' 
  | 'seasonal' 
  | 'environmental';

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  type: HolidayType;
}

// United States Holidays (37 holidays)
const US_HOLIDAYS_2025: Holiday[] = [
  { date: '2025-01-01', name: 'New Year\'s Day', type: 'celebration' },
  { date: '2025-01-20', name: 'Martin Luther King Jr. Day', type: 'patriotic' },
  { date: '2025-02-02', name: 'Groundhog Day', type: 'seasonal' },
  { date: '2025-02-14', name: 'Valentine\'s Day', type: 'gift-giving' },
  { date: '2025-02-17', name: 'Presidents Day', type: 'patriotic' },
  { date: '2025-03-08', name: 'International Women\'s Day', type: 'celebration' },
  { date: '2025-03-17', name: 'St. Patrick\'s Day', type: 'celebration' },
  { date: '2025-03-20', name: 'Spring Equinox', type: 'seasonal' },
  { date: '2025-04-01', name: 'April Fools\' Day', type: 'celebration' },
  { date: '2025-04-20', name: 'Easter Sunday', type: 'celebration' },
  { date: '2025-04-22', name: 'Earth Day', type: 'environmental' },
  { date: '2025-05-01', name: 'May Day', type: 'celebration' },
  { date: '2025-05-05', name: 'Cinco de Mayo', type: 'celebration' },
  { date: '2025-05-11', name: 'Mother\'s Day', type: 'gift-giving' },
  { date: '2025-05-26', name: 'Memorial Day', type: 'patriotic' },
  { date: '2025-06-14', name: 'Flag Day', type: 'patriotic' },
  { date: '2025-06-15', name: 'Father\'s Day', type: 'gift-giving' },
  { date: '2025-06-19', name: 'Juneteenth', type: 'patriotic' },
  { date: '2025-06-21', name: 'Summer Solstice', type: 'seasonal' },
  { date: '2025-07-04', name: 'Independence Day', type: 'patriotic' },
  { date: '2025-08-01', name: 'Back to School Season', type: 'seasonal' },
  { date: '2025-09-01', name: 'Labor Day', type: 'patriotic' },
  { date: '2025-09-22', name: 'Autumn Equinox', type: 'seasonal' },
  { date: '2025-10-13', name: 'Columbus Day', type: 'patriotic' },
  { date: '2025-10-31', name: 'Halloween', type: 'seasonal' },
  { date: '2025-11-11', name: 'Veterans Day', type: 'patriotic' },
  { date: '2025-11-27', name: 'Thanksgiving', type: 'celebration' },
  { date: '2025-11-28', name: 'Black Friday', type: 'shopping' },
  { date: '2025-11-29', name: 'Small Business Saturday', type: 'shopping' },
  { date: '2025-12-01', name: 'Cyber Monday', type: 'shopping' },
  { date: '2025-12-07', name: 'Pearl Harbor Day', type: 'patriotic' },
  { date: '2025-12-21', name: 'Winter Solstice', type: 'seasonal' },
  { date: '2025-12-24', name: 'Christmas Eve', type: 'gift-giving' },
  { date: '2025-12-25', name: 'Christmas Day', type: 'gift-giving' },
  { date: '2025-12-26', name: 'Kwanzaa Begins', type: 'celebration' },
  { date: '2025-12-31', name: 'New Year\'s Eve', type: 'celebration' }
];

// United Kingdom Holidays (32 holidays)
const UK_HOLIDAYS_2025: Holiday[] = [
  { date: '2025-01-01', name: 'New Year\'s Day', type: 'celebration' },
  { date: '2025-01-25', name: 'Burns Night', type: 'celebration' },
  { date: '2025-02-14', name: 'Valentine\'s Day', type: 'gift-giving' },
  { date: '2025-03-01', name: 'St. David\'s Day', type: 'celebration' },
  { date: '2025-03-08', name: 'International Women\'s Day', type: 'celebration' },
  { date: '2025-03-17', name: 'St. Patrick\'s Day', type: 'celebration' },
  { date: '2025-03-20', name: 'Spring Equinox', type: 'seasonal' },
  { date: '2025-03-30', name: 'Mothering Sunday', type: 'gift-giving' },
  { date: '2025-04-01', name: 'April Fools\' Day', type: 'celebration' },
  { date: '2025-04-18', name: 'Good Friday', type: 'celebration' },
  { date: '2025-04-20', name: 'Easter Sunday', type: 'celebration' },
  { date: '2025-04-21', name: 'Easter Monday', type: 'celebration' },
  { date: '2025-04-22', name: 'Earth Day', type: 'environmental' },
  { date: '2025-04-23', name: 'St. George\'s Day', type: 'patriotic' },
  { date: '2025-05-01', name: 'May Day', type: 'celebration' },
  { date: '2025-05-05', name: 'Early May Bank Holiday', type: 'celebration' },
  { date: '2025-05-26', name: 'Spring Bank Holiday', type: 'celebration' },
  { date: '2025-06-15', name: 'Father\'s Day', type: 'gift-giving' },
  { date: '2025-06-21', name: 'Summer Solstice', type: 'seasonal' },
  { date: '2025-08-25', name: 'Summer Bank Holiday', type: 'celebration' },
  { date: '2025-09-22', name: 'Autumn Equinox', type: 'seasonal' },
  { date: '2025-10-31', name: 'Halloween', type: 'seasonal' },
  { date: '2025-11-05', name: 'Guy Fawkes Night', type: 'celebration' },
  { date: '2025-11-11', name: 'Remembrance Day', type: 'patriotic' },
  { date: '2025-11-28', name: 'Black Friday', type: 'shopping' },
  { date: '2025-11-30', name: 'St. Andrew\'s Day', type: 'celebration' },
  { date: '2025-12-01', name: 'Cyber Monday', type: 'shopping' },
  { date: '2025-12-21', name: 'Winter Solstice', type: 'seasonal' },
  { date: '2025-12-24', name: 'Christmas Eve', type: 'gift-giving' },
  { date: '2025-12-25', name: 'Christmas Day', type: 'gift-giving' },
  { date: '2025-12-26', name: 'Boxing Day', type: 'gift-giving' },
  { date: '2025-12-31', name: 'New Year\'s Eve', type: 'celebration' }
];

// India Holidays (32 holidays)
const INDIA_HOLIDAYS_2025: Holiday[] = [
  { date: '2025-01-14', name: 'Makar Sankranti', type: 'festival' },
  { date: '2025-01-26', name: 'Republic Day', type: 'patriotic' },
  { date: '2025-02-14', name: 'Valentine\'s Day', type: 'gift-giving' },
  { date: '2025-02-26', name: 'Maha Shivratri', type: 'festival' },
  { date: '2025-03-08', name: 'International Women\'s Day', type: 'celebration' },
  { date: '2025-03-14', name: 'Holi', type: 'festival' },
  { date: '2025-03-20', name: 'Spring Equinox', type: 'seasonal' },
  { date: '2025-03-30', name: 'Ugadi', type: 'festival' },
  { date: '2025-04-06', name: 'Ram Navami', type: 'festival' },
  { date: '2025-04-13', name: 'Baisakhi', type: 'festival' },
  { date: '2025-04-22', name: 'Earth Day', type: 'environmental' },
  { date: '2025-05-01', name: 'Labour Day', type: 'celebration' },
  { date: '2025-05-12', name: 'Mother\'s Day', type: 'gift-giving' },
  { date: '2025-06-15', name: 'Father\'s Day', type: 'gift-giving' },
  { date: '2025-06-21', name: 'International Yoga Day', type: 'celebration' },
  { date: '2025-07-13', name: 'Guru Purnima', type: 'festival' },
  { date: '2025-08-15', name: 'Independence Day', type: 'patriotic' },
  { date: '2025-08-16', name: 'Janmashtami', type: 'festival' },
  { date: '2025-08-27', name: 'Ganesh Chaturthi', type: 'festival' },
  { date: '2025-09-06', name: 'Ganesh Visarjan', type: 'festival' },
  { date: '2025-09-22', name: 'Autumn Equinox', type: 'seasonal' },
  { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'patriotic' },
  { date: '2025-10-02', name: 'Dussehra', type: 'festival' },
  { date: '2025-10-20', name: 'Diwali', type: 'festival' },
  { date: '2025-10-21', name: 'Govardhan Puja', type: 'festival' },
  { date: '2025-10-23', name: 'Bhai Dooj', type: 'festival' },
  { date: '2025-11-05', name: 'Guru Nanak Jayanti', type: 'festival' },
  { date: '2025-11-28', name: 'Black Friday', type: 'shopping' },
  { date: '2025-12-01', name: 'Cyber Monday', type: 'shopping' },
  { date: '2025-12-21', name: 'Winter Solstice', type: 'seasonal' },
  { date: '2025-12-25', name: 'Christmas Day', type: 'gift-giving' },
  { date: '2025-12-31', name: 'New Year\'s Eve', type: 'celebration' }
];

// Export holiday data by country
export const HOLIDAYS_2025 = {
  US: US_HOLIDAYS_2025,
  UK: UK_HOLIDAYS_2025,
  IN: INDIA_HOLIDAYS_2025
} as const;

// Get holidays for a specific country
export function getHolidaysByCountry(country: CountryCode): Holiday[] {
  return HOLIDAYS_2025[country] || [];
}

// Get holidays within a date range
export function getHolidaysInRange(
  country: CountryCode, 
  startDate: Date, 
  endDate: Date
): Holiday[] {
  const countryHolidays = getHolidaysByCountry(country);
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  return countryHolidays.filter(holiday => {
    return holiday.date >= start && holiday.date <= end;
  });
}

// Get holidays for the next N days from today
export function getUpcomingHolidays(
  country: CountryCode, 
  days: number = 7
): Holiday[] {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return getHolidaysInRange(country, today, futureDate);
}

// Check if a specific date is a holiday
export function isHoliday(country: CountryCode, date: Date): Holiday | null {
  const dateString = date.toISOString().split('T')[0];
  const countryHolidays = getHolidaysByCountry(country);
  
  return countryHolidays.find(holiday => holiday.date === dateString) || null;
}

// Get holiday relevance score for content generation
export function getHolidayRelevanceScore(holiday: Holiday, productType?: string): number {
  // Base relevance scores by holiday type
  const baseScores: Record<HolidayType, number> = {
    'gift-giving': 10,    // High relevance for e-commerce
    'shopping': 10,       // Perfect for product promotion
    'celebration': 8,     // Good for festive content
    'seasonal': 7,        // Good for timely content
    'festival': 6,        // Moderate cultural relevance
    'patriotic': 5,       // Lower for general products
    'environmental': 4    // Lower unless eco-friendly products
  };
  
  let score = baseScores[holiday.type] || 3;
  
  // Boost score for specific product types
  if (productType) {
    if (holiday.type === 'gift-giving' && ['jewelry', 'fashion', 'home'].includes(productType)) {
      score += 2;
    }
    if (holiday.type === 'seasonal' && ['clothing', 'outdoor', 'home'].includes(productType)) {
      score += 1;
    }
  }
  
  return Math.min(score, 10); // Cap at 10
}

// Get the next major holiday for a country
export function getNextMajorHoliday(country: CountryCode): Holiday | null {
  const majorHolidayTypes: HolidayType[] = ['gift-giving', 'shopping', 'celebration'];
  const upcoming = getUpcomingHolidays(country, 30); // Next 30 days
  
  return upcoming.find(holiday => majorHolidayTypes.includes(holiday.type)) || null;
}