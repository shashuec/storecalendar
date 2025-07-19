'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { exportCalendarToCSV } from '@/lib/calendar-generation';
import { WeeklyCalendar as WeeklyCalendarType } from '@/types';

interface SharedCalendarPageProps {
  params: { id: string };
}

export default function SharedCalendarPage({ params }: SharedCalendarPageProps) {
  const [calendar, setCalendar] = useState<WeeklyCalendarType | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewCount, setViewCount] = useState<number>(0);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const response = await fetch(`/api/calendar/${params.id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setCalendar(data.calendar);
          setStoreName(data.storeName);
          setViewCount(data.viewCount);
        } else {
          setError(data.error || 'Failed to load calendar');
        }
      } catch (err) {
        setError('Failed to load calendar');
        console.error('Error fetching calendar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [params.id]);

  const handleExportCSV = () => {
    if (!calendar) return;

    const csvContent = exportCalendarToCSV(calendar);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${storeName}-week-${calendar.week_number}-calendar.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyShareUrl = async () => {
    const shareUrl = window.location.href;
    await navigator.clipboard.writeText(shareUrl);
    // Could add toast notification here
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold mb-2">Calendar Not Found</h1>
          <p className="text-white/80 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-white text-purple-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Your Own Calendar
          </Link>
        </div>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No calendar data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl font-bold text-white mb-2">
              📅 StoreCalendar
            </h1>
          </Link>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {storeName}'s Content Calendar
            </h2>
            <p className="text-white/80 text-sm">
              Week {calendar.week_number} • {calendar.country.toUpperCase()} • {calendar.brand_tone} tone
            </p>
            <p className="text-white/60 text-xs mt-2">
              Viewed {viewCount} time{viewCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={handleExportCSV}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV
          </button>
          
          <button
            onClick={handleCopyShareUrl}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Copy Share Link
          </button>

          <Link
            href="/"
            className="px-6 py-3 bg-white text-purple-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Your Own
          </Link>
        </div>

        {/* Calendar Display */}
        <WeeklyCalendar calendar={calendar} className="max-w-7xl mx-auto" />

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-white/60 text-sm">
            Create your own AI-powered content calendar at{' '}
            <Link href="/" className="text-white hover:underline">
              StoreCalendar.app
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}