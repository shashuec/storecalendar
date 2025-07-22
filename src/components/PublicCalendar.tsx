'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CalendarPost } from '@/types';

interface PublicCalendarProps {
  calendar: {
    shareToken: string;
    title: string;
    description: string;
    storeName: string;
    weekNumber: number;
    startDate: string;
    endDate: string;
    country: string;
    brandTone: string;
    calendarData: {
      posts: CalendarPost[];
      week_number: number;
      start_date: string;
      end_date: string;
      country: string;
      brand_tone: string;
    };
    sharedAt: string;
  };
}

export default function PublicCalendar({ calendar }: PublicCalendarProps) {
  const [copiedPost, setCopiedPost] = useState<string | null>(null);

  const handleCopyPost = async (post: CalendarPost) => {
    try {
      await navigator.clipboard.writeText(post.caption_text);
      setCopiedPost(post.id);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const posts = calendar.calendarData.posts || [];

  return (
    <div className="space-y-6">
      {/* Calendar Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {post.day.slice(0, 3).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{post.day}</h3>
                  <p className="text-sm text-white/60">{new Date(post.date).toLocaleDateString('en-US')}</p>
                </div>
              </div>
              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-lg">
                {post.post_type}
              </span>
            </div>

            {/* Product Image */}
            {post.product_featured?.image_url && (
              <div className="mb-4 rounded-xl overflow-hidden relative h-48">
                <Image
                  src={post.product_featured.image_url}
                  alt={post.product_featured.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Caption */}
            <div className="mb-4">
              <p className="text-white/90 text-sm leading-relaxed">
                {post.caption_text}
              </p>
            </div>

            {/* Product Info */}
            {post.product_featured && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-medium text-white text-sm mb-1">
                  {post.product_featured.name}
                </h4>
                <p className="text-white/60 text-xs mb-2">
                  {post.product_featured.price}
                </p>
                {post.product_featured.description && (
                  <p className="text-white/50 text-xs line-clamp-2">
                    {post.product_featured.description}
                  </p>
                )}
              </div>
            )}

            {/* Holiday Context */}
            {post.holiday_context && (
              <div className="mb-4 p-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                <p className="text-yellow-300 text-xs font-medium">
                  🎉 {post.holiday_context.name}
                </p>
              </div>
            )}

            {/* Copy Button */}
            <button
              onClick={() => handleCopyPost(post)}
              className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 px-4 rounded-lg border border-white/20 transition-all duration-300 flex items-center justify-center gap-2"
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

      {/* Share Info */}
      <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
        <p className="text-white/60 text-sm">
          Calendar shared on {new Date(calendar.sharedAt).toLocaleDateString('en-US')}
        </p>
        <p className="text-white/50 text-xs mt-1">
          {posts.length} posts • Week {calendar.weekNumber} • {calendar.country} • {calendar.brandTone} tone
        </p>
      </div>
    </div>
  );
}