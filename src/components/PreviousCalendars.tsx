'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface Calendar {
  id: string;
  businessType?: 'product' | 'service';
  storeName: string; // Business name for both product and service
  storeUrl: string;  // Business URL for both product and service
  weekNumber: number;
  startDate: string;
  endDate: string;
  country: string;
  brandTone: string;
  productCount: number;
  serviceCategory?: string | null;
  createdAt: string;
  isPublic: boolean;
  shareToken: string | null;
  shareTitle: string | null;
  shareDescription: string | null;
  sharedAt: string | null;
  publicUrl: string | null;
}

interface PreviousCalendarsProps {
  className?: string;
}

export default function PreviousCalendars({ className = '' }: PreviousCalendarsProps) {
  const { user, getAuthHeaders } = useAuth();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [sharingCalendar, setSharingCalendar] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  // Fetch user's previous calendars
  const fetchCalendars = async (page = 1, limit = pageSize) => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const offset = (page - 1) * limit;
      const response = await fetch(`/api/calendar/history?limit=${limit}&offset=${offset}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendars');
      }
      
      if (data.success) {
        setCalendars(data.calendars);
        setTotalCount(data.pagination.total);
        setHasMore(data.pagination.hasMore);
        setCurrentPage(page);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch calendars';
      setError(errorMessage);
      console.error('Error fetching calendars:', err);
    } finally {
      setLoading(false);
    }
  };

  // Share a calendar publicly
  const shareCalendar = async (calendarId: string) => {
    setSharingCalendar(calendarId);
    
    try {
      const response = await fetch('/api/calendar/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          calendarId,
          title: `Weekly Social Media Calendar`,
          description: 'AI-generated social media content calendar'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to share calendar');
      }
      
      if (data.success) {
        // Update the calendar in the local state
        setCalendars(prevCalendars => 
          prevCalendars.map(cal => 
            cal.id === calendarId 
              ? { 
                  ...cal, 
                  isPublic: true, 
                  shareToken: data.shareToken,
                  publicUrl: data.publicUrl,
                  sharedAt: new Date().toISOString()
                }
              : cal
          )
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share calendar';
      setError(errorMessage);
      console.error('Error sharing calendar:', err);
    } finally {
      setSharingCalendar(null);
    }
  };

  // Copy public URL to clipboard
  const copyPublicUrl = async (url: string, calendarId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(calendarId);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchCalendars(currentPage - 1, pageSize);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      fetchCalendars(currentPage + 1, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    fetchCalendars(1, newPageSize);
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  useEffect(() => {
    fetchCalendars();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return null;
  }

  if (loading && calendars.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-white/20">
          <div className="animate-pulse">
            <div className="h-5 sm:h-6 bg-white/20 rounded mb-3 sm:mb-4 w-32 sm:w-48"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 sm:h-16 bg-white/10 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (calendars.length === 0 && !loading) {
    return null; // Don't show anything if user has no calendars
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Your Previous Calendars</h3>
            <div className="text-white/70 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <span>
                  {totalCount === 0 ? 'No calendars yet' : 
                   totalCount === 1 ? '1 calendar created' : 
                   `${totalCount} calendars created`}
                </span>
                {totalCount > 0 && (
                  <span className="sm:ml-2 text-white/50">
                    <span className="hidden sm:inline">• </span>
                    Showing {startItem}-{endItem} of {totalCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Page Size Selector */}
          {totalCount > 5 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white/70 text-xs sm:text-sm">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                style={{ colorScheme: 'dark' }}
              >
                <option value={5} className="bg-slate-800 text-white">5</option>
                <option value={10} className="bg-slate-800 text-white">10</option>
                <option value={20} className="bg-slate-800 text-white">20</option>
                <option value={50} className="bg-slate-800 text-white">50</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 sm:mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 relative">
          {loading && calendars.length > 0 && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
              <div className="bg-white/10 rounded-lg px-3 sm:px-4 py-2 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-white text-xs sm:text-sm">Loading...</span>
              </div>
            </div>
          )}
          
          {calendars.map((calendar) => (
            <div
              key={calendar.id}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0">
                  {/* Header with store name and badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate flex-shrink-0">
                      {calendar.storeName}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {calendar.businessType === 'service' ? (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-medium whitespace-nowrap">
                          Service
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium whitespace-nowrap">
                          Product
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium whitespace-nowrap">
                        Week {calendar.weekNumber}
                      </span>
                      {calendar.isPublic && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-lg text-xs font-medium whitespace-nowrap">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Calendar details - responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-white/60 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap">{formatDate(calendar.startDate)} - {formatDate(calendar.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      {calendar.businessType === 'service' && calendar.serviceCategory ? (
                        <span className="flex items-center gap-1">
                          <span className="hidden sm:inline">•</span>
                          <span className="capitalize">{calendar.serviceCategory.replace('_', ' ')}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="hidden sm:inline">•</span>
                          <span>{calendar.productCount} products</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="hidden sm:inline">•</span>
                        <span className="capitalize">{calendar.brandTone} tone</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="hidden sm:inline">•</span>
                        <span>{calendar.country}</span>
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-white/50 text-xs">
                    Created {getRelativeTime(calendar.createdAt)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                  {calendar.isPublic && calendar.publicUrl ? (
                    <Button
                      onClick={() => copyPublicUrl(calendar.publicUrl!, calendar.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 sm:px-3 py-1.5 h-auto rounded-lg transition-all duration-300 flex-1 sm:flex-initial"
                    >
                      {copiedUrl === calendar.id ? (
                        <span className="flex items-center gap-1 justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="hidden sm:inline">Copied!</span>
                          <span className="sm:hidden">✓</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">Copy Link</span>
                          <span className="sm:hidden">Copy</span>
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => shareCalendar(calendar.id)}
                      disabled={sharingCalendar === calendar.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 sm:px-3 py-1.5 h-auto rounded-lg transition-all duration-300 disabled:opacity-50 flex-1 sm:flex-initial"
                    >
                      {sharingCalendar === calendar.id ? (
                        <span className="flex items-center gap-1 justify-center">
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Sharing...</span>
                          <span className="sm:hidden">...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          <span className="hidden sm:inline">Share</span>
                          <span className="sm:hidden">Share</span>
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-white/10">
            {/* Mobile Pagination */}
            <div className="flex sm:hidden items-center justify-between">
              <Button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 h-auto rounded-lg border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-xs">Prev</span>
              </Button>
              
              <div className="flex flex-col items-center">
                <div className="text-white/70 text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="text-white/50 text-xs">
                  {startItem}-{endItem} of {totalCount}
                </div>
              </div>
              
              <Button
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 h-auto rounded-lg border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span className="text-xs">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden sm:flex items-center justify-between">
              {/* Page Info */}
              <div className="text-white/70 text-sm">
                Page {currentPage} of {totalPages}
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 h-auto rounded-lg border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchCalendars(pageNum, pageSize)}
                        disabled={loading}
                        className={`w-8 h-8 text-sm rounded-lg transition-all duration-300 disabled:opacity-50 ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-2 h-auto rounded-lg border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}