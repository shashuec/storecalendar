'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ShareCalendarButtonProps {
  calendarId: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function ShareCalendarButton({ 
  calendarId, 
  title = 'Weekly Social Media Calendar',
  description = 'AI-generated social media content calendar',
  className = ''
}: ShareCalendarButtonProps) {
  const { getAuthHeaders } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [shareData, setShareData] = useState<{
    shareToken: string;
    publicUrl: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    setError('');

    try {
      const response = await fetch('/api/calendar/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          calendarId,
          title,
          description,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareData({
          shareToken: data.shareToken,
          publicUrl: data.publicUrl,
        });
      } else {
        setError(data.error || 'Failed to share calendar');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!shareData?.publicUrl) return;

    try {
      await navigator.clipboard.writeText(shareData.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleRevokeAccess = async () => {
    if (!shareData?.shareToken) return;

    setIsSharing(true);
    setError('');

    try {
      const response = await fetch(`/api/calendar/share?calendarId=${calendarId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        setShareData(null);
      } else {
        setError(data.error || 'Failed to revoke access');
      }
    } catch (_err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  if (shareData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-green-500/20 backdrop-blur-sm rounded-xl border border-green-400/30">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-300 font-medium">Calendar is now public!</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">
                Share URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={shareData.publicUrl}
                  readOnly
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/90 text-xs sm:text-sm break-all"
                />
                <Button
                  onClick={handleCopyUrl}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap flex items-center justify-center"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => window.open(shareData.publicUrl, '_blank')}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm py-2 px-3 sm:px-4 flex items-center justify-center"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Preview
              </Button>
              <Button
                onClick={handleRevokeAccess}
                disabled={isSharing}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs sm:text-sm py-2 px-3 sm:px-4 whitespace-nowrap"
              >
                {isSharing ? 'Revoking...' : 'Revoke Access'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        onClick={handleShare}
        disabled={isSharing}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
      >
        {isSharing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="whitespace-nowrap">Sharing...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Calendar
          </div>
        )}
      </Button>
      
      {error && (
        <div className="mt-3 p-3 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/30">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}