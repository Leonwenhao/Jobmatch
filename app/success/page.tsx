'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

export default function SuccessPage() {
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

    // Poll for results to be ready
    const checkResults = async () => {
      try {
        // In a real implementation, we'd poll the backend to check if processing is complete
        // For now, we'll wait a few seconds and then redirect
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Redirect to results page
        // Note: We'll need to map the Stripe checkout session ID back to our session ID
        // For now, this is a simplified version
        router.push(`/results/${checkoutSessionId}`);
      } catch (err) {
        console.error('Error checking results:', err);
        setError('Failed to retrieve results');
        setIsProcessing(false);
      }
    };

    checkResults();
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
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            Return Home
          </a>
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
