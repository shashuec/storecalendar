import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicCalendar from '@/components/PublicCalendar';

interface PublicCalendarData {
  shareToken: string;
  title: string;
  description: string;
  storeName: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  country: string;
  brandTone: string;
  calendarData: any;
  sharedAt: string;
}

interface PageProps {
  params: {
    shareToken: string;
  };
}

async function getPublicCalendar(shareToken: string): Promise<PublicCalendarData | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/calendar/public?token=${shareToken}`, {
      cache: 'no-store', // Always fetch fresh data for public calendars
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.calendar : null;
  } catch (error) {
    console.error('Error fetching public calendar:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const calendar = await getPublicCalendar(params.shareToken);

  if (!calendar) {
    return {
      title: 'Calendar Not Found',
      description: 'The requested calendar could not be found.',
    };
  }

  const title = `${calendar.title} - ${calendar.storeName}`;
  const description = calendar.description;
  const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${params.shareToken}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: 'StoreCalendar',
      images: [
        {
          url: '/api/og?title=' + encodeURIComponent(title) + '&description=' + encodeURIComponent(description),
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/api/og?title=' + encodeURIComponent(title) + '&description=' + encodeURIComponent(description)],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PublicCalendarPage({ params }: PageProps) {
  const calendar = await getPublicCalendar(params.shareToken);

  if (!calendar) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent" />
      
      {/* Header */}
      <header className="relative px-4 lg:px-6 h-20 flex items-center border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">SC</span>
            </div>
            <span className="font-bold text-xl text-white">StoreCalendar</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">Shared Calendar</span>
            <a 
              href="/"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
            >
              Create Your Own
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative px-4 lg:px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Calendar Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {calendar.title}
            </h1>
            <p className="text-xl text-white/70 mb-2">
              {calendar.description}
            </p>
            <p className="text-lg text-white/60">
              For <span className="text-blue-400 font-semibold">{calendar.storeName}</span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-white/50">
              <span>Week {calendar.weekNumber}</span>
              <span>•</span>
              <span>{new Date(calendar.startDate).toLocaleDateString('en-US')} - {new Date(calendar.endDate).toLocaleDateString('en-US')}</span>
              <span>•</span>
              <span className="capitalize">{calendar.brandTone} Tone</span>
            </div>
          </div>

          {/* Public Calendar Component */}
          <PublicCalendar calendar={calendar} />

          {/* Call to Action */}
          <div className="text-center mt-16 p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Create Your Own AI-Powered Calendar
            </h2>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Generate weekly social media content calendars for your e-commerce store with AI. 
              Get strategic, holiday-aware posts that drive engagement and sales.
            </p>
            <a 
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Get Started Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black/20 backdrop-blur-xl py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <p className="text-white/60 text-sm">
            Powered by <span className="text-blue-400 font-semibold">StoreCalendar</span> - 
            AI-driven social media content for e-commerce
          </p>
        </div>
      </footer>
    </div>
  );
}