'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import Image from 'next/image';
import { WeeklyCalendar as WeeklyCalendarType, CalendarPost } from '@/types';
import { exportCalendarToCSV } from '@/lib/calendar-generation';

interface WeeklyCalendarProps {
  calendar: WeeklyCalendarType;
  onCopyPost?: (post: CalendarPost) => void;
  onEditPost?: (post: CalendarPost) => void;
  className?: string;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const POST_TYPE_COLORS = {
  'Product Showcase': 'bg-blue-100 text-blue-800 border-blue-200',
  'Testimonial': 'bg-green-100 text-green-800 border-green-200',
  'How-to': 'bg-purple-100 text-purple-800 border-purple-200',
  'Behind-Scenes': 'bg-orange-100 text-orange-800 border-orange-200',
  'Benefits-Focused': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Social Proof': 'bg-pink-100 text-pink-800 border-pink-200',
  'Call-to-Action': 'bg-red-100 text-red-800 border-red-200'
};

function getPostTypeColor(postType: string): string {
  return POST_TYPE_COLORS[postType as keyof typeof POST_TYPE_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

const PostCard = memo(function PostCard({ 
  post, 
  onCopy, 
  onEdit 
}: { 
  post: CalendarPost; 
  onCopy?: (post: CalendarPost) => void;
  onEdit?: (post: CalendarPost) => void;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy(post);
    } else {
      await navigator.clipboard.writeText(post.caption_text);
    }
    
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [onCopy, post]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPostTypeColor(post.post_type)}`}>
            {post.post_type}
          </span>
          {post.holiday_context && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              🎉 {post.holiday_context.name}
            </span>
          )}
          {post.product_featured.url && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              🛒 Shop Link
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {onEdit && (
            <button
              onClick={() => onEdit(post)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Edit post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className={`p-1 rounded transition-colors ${
              isCopied 
                ? 'text-green-600 bg-green-100' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Copy caption"
          >
            {isCopied ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Product Image & Info */}
      {post.product_featured.image_url && (
        <div className="mb-3 flex items-start space-x-3">
          {post.product_featured.url ? (
            <a 
              href={post.product_featured.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0 group"
            >
              <Image 
                src={post.product_featured.image_url} 
                alt={post.product_featured.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 group-hover:border-blue-300 transition-colors"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </a>
          ) : (
            <Image 
              src={post.product_featured.image_url} 
              alt={post.product_featured.name}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {post.product_featured.name}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {post.product_featured.price && `${post.product_featured.price}`}
            </p>
            {post.product_featured.url && (
              <p className="text-xs text-blue-600 mt-1">
                <a 
                  href={post.product_featured.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View Product →
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Caption Text */}
      <div className="mb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
          {post.caption_text}
        </p>
      </div>

    </div>
  );
});

export const WeeklyCalendar = memo(function WeeklyCalendar({ 
  calendar, 
  onCopyPost, 
  onEditPost, 
  className = '' 
}: WeeklyCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

  // Group posts by day - memoized to prevent recalculation on every render
  const postsByDay = useMemo(() => {
    return calendar.posts.reduce((acc, post) => {
      acc[post.day] = post;
      return acc;
    }, {} as Record<string, CalendarPost>);
  }, [calendar.posts]);

  // Memoize day selection handler
  const handleDaySelection = useCallback((day: string) => {
    setSelectedDay(current => current === day ? null : day);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {calendar.week_number === 1 ? 'Your Weekly Calendar' : `Week ${calendar.week_number} Calendar`}
            </h2>
            <p className="text-sm text-gray-500">
              {formatDate(calendar.start_date)} - {formatDate(calendar.end_date)}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Country:</span>
              <span className="font-medium">{calendar.country}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Tone:</span>
              <span className="font-medium capitalize">{calendar.brand_tone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Products:</span>
              <span className="font-medium">{calendar.selected_products.length}</span>
            </div>
          </div>
        </div>

        {/* Week Overview */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const post = postsByDay[day];
            const isSelected = selectedDay === day;
            
            return (
              <button
                key={day}
                onClick={() => handleDaySelection(day)}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : post 
                      ? 'border-gray-200 bg-white hover:border-gray-300' 
                      : 'border-dashed border-gray-300 bg-gray-50'
                  }
                `}
              >
                <div className="font-medium text-sm text-gray-900 mb-1">
                  {day.substring(0, 3)}
                </div>
                {post && (
                  <>
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDate(post.date)}
                    </div>
                    
                    {/* Small product image preview */}
                    {post.product_featured.image_url && (
                      <div className="mb-2">
                        <Image 
                          src={post.product_featured.image_url} 
                          alt={post.product_featured.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getPostTypeColor(post.post_type)}`}>
                      {post.post_type.split(' ')[0]}
                    </div>
                    {post.holiday_context && (
                      <div className="text-xs text-yellow-600 mt-1">
                        🎉 {post.holiday_context.name.split(' ')[0]}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && postsByDay[selectedDay] && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            {selectedDay} - {formatDate(postsByDay[selectedDay].date)}
          </h3>
          <PostCard 
            post={postsByDay[selectedDay]} 
            onCopy={onCopyPost}
            onEdit={onEditPost}
          />
        </div>
      )}

      {/* All Posts Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Complete Weekly Calendar
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS_OF_WEEK.map((day) => {
            const post = postsByDay[day];
            
            if (!post) {
              return (
                <div key={day} className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <div className="text-sm font-medium text-gray-500 mb-2">{day}</div>
                  <div className="text-xs text-gray-400">No post scheduled</div>
                </div>
              );
            }

            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{day}</h4>
                  <span className="text-xs text-white/70">{formatDate(post.date)}</span>
                </div>
                <PostCard 
                  post={post} 
                  onCopy={onCopyPost}
                  onEdit={onEditPost}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            <p>✨ Your {calendar.week_number === 1 ? 'weekly' : `week ${calendar.week_number}`} calendar is ready!</p>
            <p className="text-xs text-gray-500 mt-1">
              Click any post to copy the caption, or export the full calendar below.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button 
              onClick={handleExportCSV}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
            
            {calendar.week_number === 1 && (
              <button className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                Generate Week 2
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default WeeklyCalendar;