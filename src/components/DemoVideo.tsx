'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DemoVideoProps {
  className?: string;
}

export default function DemoVideo({ className = '' }: DemoVideoProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        
        // Get the public URL for the video from Supabase storage
        const { data } = supabase.storage
          .from('video')
          .getPublicUrl('StoreCalender.mp4'); 
        
        if (data?.publicUrl) {
          setVideoUrl(data.publicUrl);
        } else {
          setError('Video not found');
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, []);

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-4xl mx-auto">
          <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/60 text-sm sm:text-base">Loading demo video...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl max-w-4xl mx-auto">
          <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-400 text-sm mb-1">Failed to load demo video</p>
              <p className="text-white/60 text-xs">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-2 sm:p-6 lg:p-8 border border-white/20 shadow-2xl max-w-6xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl" />
        <div className="relative">
          {/* Video Title - Optimized for mobile */}
          <div className="text-center mb-2 sm:mb-6">
            {/* <h2 className="text-sm sm:text-2xl lg:text-3xl font-bold text-white mb-2">
              See StoreCalendar in Action
            </h2> */}
            
          </div>

          {/* Video Container */}
          <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-2xl bg-black/20">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full aspect-video object-cover bg-black"
              poster="/image.png"
            >
              <source src={videoUrl || ''} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* Video overlay for better mobile experience */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Video Features - Compact for mobile */}
          <div className="mt-4 sm:mt-6">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-[8px] sm:text-sm">
              <span className="flex items-center gap-1.5 text-white/80">
                <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Auto-selection
              </span>
              <span className="flex items-center gap-1.5 text-white/80">
                <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                AI Captions
              </span>
              <span className="flex items-center gap-1.5 text-white/80">
                <svg className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Weekly Calendar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}