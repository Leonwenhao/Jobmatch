'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkoutSessionId = searchParams.get('session_id');

    if (!checkoutSessionId) {
      setError('No session ID found');
      setIsProcessing(false);
      return;
    }

    // Get our session ID from Stripe checkout metadata (more reliable than localStorage)
    const redirectToResults = async () => {
      try {
        // Wait a moment for webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch our session ID from Stripe checkout session metadata
        const response = await fetch(`/api/get-session?checkout_session_id=${checkoutSessionId}`);

        if (response.ok) {
          const { sessionId } = await response.json();
          router.push(`/results/${sessionId}`);
          return;
        }

        // Fallback to localStorage if API fails (for backwards compatibility)
        const localSessionId = localStorage.getItem('jobmatch_session_id');
        if (localSessionId) {
          router.push(`/results/${localSessionId}`);
          return;
        }

        // No session found
        setError('Could not find your session. Please check your email for results or contact support.');
        setIsProcessing(false);
      } catch (err) {
        console.error('Error redirecting:', err);
        setError('Failed to retrieve results');
        setIsProcessing(false);
      }
    };

    redirectToResults();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-marty-black mb-4 tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <div className="space-y-4">
            <a
              href="/"
              className="block w-full px-6 py-4 bg-marty-black hover:bg-marty-orange text-white font-semibold rounded-full transition-all duration-300"
            >
              Return Home
            </a>
            <a
              href="mailto:support@jobmatch.com"
              className="block w-full px-6 py-4 bg-marty-gray hover:bg-gray-200 text-marty-black font-medium rounded-full transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-marty-black mb-4 tracking-tight">
          Payment Successful!
        </h1>
        <p className="text-gray-500 mb-8">
          {isProcessing
            ? "Finding the perfect jobs for you..."
            : 'Redirecting to your results...'}
        </p>
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 bg-marty-orange rounded-full animate-bounce-loader" />
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 bg-marty-orange rounded-full animate-bounce-loader" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
