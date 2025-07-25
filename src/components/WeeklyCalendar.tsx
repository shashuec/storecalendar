'use client';

import { useState, memo, useCallback } from 'react';
import Image from 'next/image';
import { WeeklyCalendar as WeeklyCalendarType, CalendarPost } from '@/types';
import { exportCalendarToCSV } from '@/lib/calendar-generation';
import { useAuth } from '@/contexts/AuthContext';

interface WeeklyCalendarProps {
  calendar: WeeklyCalendarType;
  onCopyPost?: (post: CalendarPost) => void;
  onEditPost?: (post: CalendarPost) => void;
  className?: string;
  calendarId?: string;
  storeName?: string;
  onShowFeedback?: () => void;
}


export const WeeklyCalendar = memo(function WeeklyCalendar({ 
  calendar, 
  onCopyPost, 
  className = '',
  calendarId,
  storeName,
  onShowFeedback
}: WeeklyCalendarProps) {
  const [copiedPost, setCopiedPost] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareData, setShareData] = useState<{
    shareToken: string;
    publicUrl: string;
  } | null>(null);
  const [shareError, setShareError] = useState('');
  const [expandedCaptions, setExpandedCaptions] = useState<Set<string>>(new Set());
  const { getAuthHeaders } = useAuth();

  const handleExportCSV = useCallback(() => {
    const csvContent = exportCalendarToCSV(calendar);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-calendar-week-${calendar.week_number}-${calendar.start_date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [calendar]);

  const handleShareCalendar = async () => {
    if (!calendarId) return;
    
    setIsSharing(true);
    setShareError('');

    try {
      const response = await fetch('/api/calendar/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          calendarId,
          title: `${storeName} - Week ${calendar.week_number} Calendar`,
          description: `AI-generated social media calendar for ${storeName}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareData({
          shareToken: data.shareToken,
          publicUrl: data.publicUrl,
        });
      } else {
        setShareError(data.error || 'Failed to share calendar');
      }
    } catch (err) {
      setShareError('Network error. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareData?.publicUrl) return;

    try {
      await navigator.clipboard.writeText(shareData.publicUrl);
      // Could add a temporary "Copied!" state here if needed
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleCopyPost = async (post: CalendarPost) => {
    try {
      if (onCopyPost) {
        onCopyPost(post);
      } else {
        await navigator.clipboard.writeText(post.caption_text);
      }
      setCopiedPost(post.id);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleCaptionClick = useCallback((postId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedCaptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }, []);

  const handleProductBoxClick = useCallback((url: string | undefined, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const posts = calendar.posts || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Grid - Modern Card-based Design */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 flex flex-col min-h-[400px] sm:min-h-[500px]"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center ">
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {post.day.slice(0, 3).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base">{post.day}</h3>
                  <p className="text-xs sm:text-sm text-white/60">{new Date(post.date).toLocaleDateString('en-US')}</p>
                </div>
              </div>
              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-md sm:rounded-lg max-w-[70px] sm:max-w-[120px]">
                {post.post_type}
              </span>
            </div>

            {/* Product Image */}
            {post.product_featured?.image_url && (
              <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden relative h-32 sm:h-48">
                <Image
                  src={post.product_featured.image_url}
                  alt={post.product_featured.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Caption */}
            <div 
              className="mb-3 sm:mb-4 flex-1 cursor-pointer"
              onClick={(e) => handleCaptionClick(post.id, e)}
            >
              <p className="text-white/90 text-xs sm:text-sm leading-relaxed break-words overflow-hidden">
                {expandedCaptions.has(post.id) 
                  ? post.caption_text
                  : (post.caption_text.length > 150 
                      ? `${post.caption_text.substring(0, 150)}...` 
                      : post.caption_text)
                }
              </p>
              {post.caption_text.length > 150 && (
                <p className="text-white/50 text-xs mt-1">
                  {expandedCaptions.has(post.id) ? 'Click to collapse' : 'Click to expand'}
                </p>
              )}
            </div>

            {/* Product Info */}
            {post.product_featured && (
              <div 
                className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={(e) => handleProductBoxClick(post.product_featured?.url, e)}
                title={post.product_featured.url ? `Visit ${post.product_featured.name}` : 'Website not available'}
              >
                <h4 className="font-medium text-white text-xs sm:text-sm mb-1 truncate">
                  {post.product_featured.name}
                </h4>
                <p className="text-white/60 text-xs mb-1 sm:mb-2">
                  {post.product_featured.price}
                </p>
                {post.product_featured.description && (
                  <p className="text-white/50 text-xs line-clamp-2 break-words">
                    {post.product_featured.description}
                  </p>
                )}
                {post.product_featured.url && (
                  <p className="text-blue-400 text-xs mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Visit website
                  </p>
                )}
              </div>
            )}

            {/* Holiday Context */}
            {post.holiday_context && (
              <div className="mb-3 sm:mb-4 p-2 bg-yellow-500/20 rounded-md sm:rounded-lg border border-yellow-400/30">
                <p className="text-yellow-300 text-xs font-medium truncate">
                  🎉 {post.holiday_context.name}
                </p>
              </div>
            )}

            {/* Copy Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent post click
                handleCopyPost(post);
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg border border-white/20 transition-all duration-300 flex items-center justify-center gap-2 mt-auto"
            >
              {copiedPost === post.id ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Caption
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Calendar Info and Actions */}
      <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-white/80 text-xs sm:text-sm">
              Calendar for Week {calendar.week_number}
            </p>
            <p className="text-white/50 text-xs mt-1">
              {posts.length} posts • {calendar.country} • {calendar.brand_tone} tone
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            
            {calendarId && !shareData && (
              <button 
                onClick={handleShareCalendar}
                disabled={isSharing}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share Calendar
                  </>
                )}
              </button>
            )}

            {onShowFeedback && (
              <button 
                onClick={onShowFeedback}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.13 8.13 0 01-2.859-.515l-5.433 1.378a1 1 0 01-1.24-1.24l1.378-5.433A8.13 8.13 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                Feedback
              </button>
            )}
          </div>

          {/* Share Success */}
          {shareData && (
            <div className="w-full p-3 bg-green-500/20 rounded-lg border border-green-400/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-300 text-sm font-medium">Calendar shared successfully!</span>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={shareData.publicUrl}
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs break-all"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleCopyShareUrl}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => window.open(shareData.publicUrl, '_blank')}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Share Error */}
          {shareError && (
            <div className="w-full p-3 bg-red-500/20 rounded-lg border border-red-500/30">
              <p className="text-red-300 text-sm">{shareError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default WeeklyCalendar;