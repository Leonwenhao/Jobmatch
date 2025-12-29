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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Return Home
            </a>
            <a
              href="mailto:support@jobmatch.com"
              className="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          {isProcessing
            ? "We're finding the perfect jobs for you..."
            : 'Redirecting to your results...'}
        </p>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
