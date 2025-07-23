'use client';

import { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
}

interface FeedbackData {
  liked_website: boolean;
  improvement_suggestions?: string;
}

export function FeedbackModal({ isOpen, onClose, storeName }: FeedbackModalProps) {
  const [step, setStep] = useState<'initial' | 'improvement' | 'submitted'>('initial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [improvementText, setImprovementText] = useState('');
  const { user } = useAuth();

  const resetModal = useCallback(() => {
    setStep('initial');
    setError('');
    setImprovementText('');
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const submitFeedback = useCallback(async (data: FeedbackData) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          user_id: user?.id || null,
          session_id: !user ? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
          context: storeName ? `calendar_generated_for_${storeName}` : 'calendar_generated',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setStep('submitted');
      
      // Auto close after 3 seconds on successful submission
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  }, [user, storeName, handleClose]);

  const handleYesClick = useCallback(() => {
    submitFeedback({ liked_website: true });
  }, [submitFeedback]);

  const handleNoClick = useCallback(() => {
    setStep('improvement');
  }, []);

  const handleImprovementSubmit = useCallback(() => {
    if (!improvementText.trim()) {
      setError('Please provide your suggestions for improvement');
      return;
    }
    
    submitFeedback({
      liked_website: false,
      improvement_suggestions: improvementText.trim(),
    });
  }, [improvementText, submitFeedback]);

  const renderContent = () => {
    if (step === 'submitted') {
      return (
        <div className="text-center py-4 sm:py-6 px-4 sm:px-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Thank you for your feedback!</h3>
          <p className="text-white/70 text-sm mb-3 sm:mb-4">
            Your input helps us improve StoreCalendar for everyone.
          </p>
          <p className="text-white/50 text-xs">
            This dialog will close automatically...
          </p>
        </div>
      );
    }

    if (step === 'improvement') {
      return (
        <div className="py-4 px-4 sm:px-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Help us improve!</h3>
            <p className="text-white/70 text-sm">
              What can we do to make StoreCalendar better for you?
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <textarea
              value={improvementText}
              onChange={(e) => setImprovementText(e.target.value)}
              placeholder="Please share your suggestions for improvement..."
              disabled={loading}
              className="w-full h-20 sm:h-24 px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={() => setStep('initial')}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
              >
                Back
              </button>
              <button
                onClick={handleImprovementSubmit}
                disabled={loading || !improvementText.trim()}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-4 px-4 sm:px-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">How was your experience?</h3>
        <p className="text-white/70 text-sm mb-6 sm:mb-8">
          {storeName ? `We generated a calendar for ${storeName}. ` : ''}
          Did you find StoreCalendar helpful?
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={handleYesClick}
            disabled={loading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            👍 Yes, helpful!
          </button>
          
          <button
            onClick={handleNoClick}
            disabled={loading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            👎 Could be better
          </button>
        </div>

        <p className="text-white/50 text-xs mt-4 sm:mt-6">
          Your feedback helps us improve the experience for everyone
        </p>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-sm sm:max-w-md">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl">
        {renderContent()}
      </div>
    </Modal>
  );
}

export default FeedbackModal;