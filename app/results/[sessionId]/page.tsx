'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import JobList from '@/components/JobList';
import { Job } from '@/lib/types';

type ResultsStatus = 'pending' | 'paid' | 'processing' | 'complete' | 'failed';

interface ResultsResponse {
  status: ResultsStatus;
  jobs: Job[];
  email: string;
  totalJobs: number;
}

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/results/${sessionId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Session not found or expired. Please try uploading your resume again.');
          }
          const data = await response.json();
          throw new Error(data.error || 'Failed to load results');
        }

        const data: ResultsResponse = await response.json();
        setResults(data);
        setIsLoading(false);

        // If still processing, continue polling
        if (data.status === 'processing' || data.status === 'paid') {
          setPollingCount((prev) => prev + 1);
          // Poll every 2 seconds for up to 60 seconds
          if (pollingCount < 30) {
            return; // Continue polling
          }
        } else if (data.status === 'complete') {
          // Stop polling when complete
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        } else if (data.status === 'failed') {
          setError('We encountered an error processing your resume. Please contact support.');
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error fetching results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job results');
        setIsLoading(false);
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    };

    // Initial fetch
    fetchResults();

    // Set up polling for processing status
    pollInterval = setInterval(() => {
      if (results?.status === 'processing' || results?.status === 'paid' || !results) {
        fetchResults();
      }
    }, 2000);

    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [sessionId, results?.status, pollingCount]);

  // Loading state - processing
  if (isLoading || results?.status === 'processing' || results?.status === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Finding Your Perfect Matches
          </h2>
          <p className="text-gray-700 mb-2">
            Our AI is analyzing your resume and searching thousands of jobs...
          </p>
          <p className="text-sm text-gray-600">
            This usually takes 10-20 seconds
          </p>

          {/* Progress indicator */}
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Resume analyzed</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="animate-pulse">⏳</div>
              <span>Searching job databases...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <a
              href="/"
              className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </a>
            <a
              href="mailto:support@jobmatch.com"
              className="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // No jobs found
  if (results && results.jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Matches Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find jobs matching your resume right now. This is rare, but it can happen.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            We'll keep looking and email you if we find relevant opportunities. In the meantime, please contact us for a refund.
          </p>
          <div className="space-y-3">
            <a
              href="mailto:support@jobmatch.com"
              className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/"
              className="block w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Upload Another Resume
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Success state with jobs
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Success Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="text-5xl md:text-6xl mb-4">🎯</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Your Job Matches Are Ready!
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            Here are the top {results!.jobs.length} jobs matched to your resume
          </p>
          {results!.totalJobs > 5 && (
            <p className="text-sm md:text-base text-gray-600">
              We're sending {results!.totalJobs - 5} more jobs to <span className="font-medium">{results!.email}</span>
            </p>
          )}
        </div>

        {/* Job Results */}
        <div className="max-w-4xl mx-auto">
          <JobList jobs={results!.jobs} />
        </div>

        {/* Email Notice */}
        {results!.totalJobs > 5 && (
          <div className="max-w-4xl mx-auto mt-8 bg-white border-2 border-blue-200 rounded-lg p-6 shadow-md">
            <div className="flex items-start gap-4">
              <span className="text-3xl md:text-4xl flex-shrink-0">📧</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  More Jobs Coming to Your Inbox!
                </h3>
                <p className="text-gray-700 text-sm md:text-base mb-3">
                  We're sending {results!.totalJobs - 5} additional job matches to your email. They should arrive within the next 15-30 minutes.
                </p>
                <p className="text-xs md:text-sm text-gray-600">
                  Check your spam folder if you don't see it. Email sent to: <span className="font-medium">{results!.email}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <p className="text-gray-600 text-sm md:text-base mb-4">
            Good luck with your job search! 🚀
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Search for another resume
          </a>
        </div>
      </main>
    </div>
  );
}
