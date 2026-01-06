'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-marty-black mb-4 tracking-tight">
            Session Not Found
          </h1>
          <p className="text-gray-500 mb-8">
            Please upload your resume to get started.
          </p>
          <a
            href="/"
            className="inline-block px-8 py-4 bg-marty-black hover:bg-marty-orange text-white font-semibold rounded-full transition-all duration-300"
          >
            Upload Resume
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();

      // Store session ID for retrieval after Stripe redirects back
      localStorage.setItem('jobmatch_session_id', sessionId);

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-extrabold text-marty-black mb-2 text-center tracking-tighter">
            Almost There
          </h1>
          <p className="text-gray-500 mb-10 text-center text-lg">
            Get 25 curated jobs for just <span className="text-marty-orange font-semibold">$2.99</span>
          </p>

          {/* What you get */}
          <div className="bg-marty-gray rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-marty-black mb-4">
              What you'll receive:
            </h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-marty-orange font-bold mt-0.5">&#10003;</span>
                <span>25 job matches displayed instantly</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-marty-orange font-bold mt-0.5">&#10003;</span>
                <span>Email backup so you never lose your matches</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-marty-orange font-bold mt-0.5">&#10003;</span>
                <span>AI-matched to your resume and skills</span>
              </li>
            </ul>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-marty-black mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-marty-orange focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2">
                We'll send a copy of all your matches here
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-marty-black hover:bg-marty-orange disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-full transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 bg-white rounded-full animate-bounce-loader" />
                  Processing...
                </span>
              ) : (
                'Pay $2.99 & Find My Jobs'
              )}
            </button>
          </form>

          {/* Security badges */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 bg-marty-orange rounded-full animate-bounce-loader" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
