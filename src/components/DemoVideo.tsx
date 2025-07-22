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
          .getPublicUrl('StoreCalender.mp4'); // Assuming the video file is named demo.mp4
        
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
      <div className={`${className}`}>
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60 text-sm">Loading demo video...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-400 text-sm mb-2">Failed to load demo video</p>
              <p className="text-white/60 text-xs">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl sm:rounded-3xl" />
        <div className="relative">
          {/* Video Title */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
              See StoreCalendar in Action
            </h2>
            <p className="text-white/70 text-sm sm:text-base">
              Watch how easy it is to generate a week&apos;s worth of content in seconds
            </p>
          </div>

          {/* Video Container */}
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="w-full aspect-video object-cover bg-black"
              poster="/image.png" // Optional: add a poster image
            >
              <source src={videoUrl || ''} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Video Description */}
          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-white/60 text-xs sm:text-sm">
              🎬 This demo shows the complete process from store URL to generated calendar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}