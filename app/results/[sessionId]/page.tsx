'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

  // Use refs to track state without causing re-renders
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const shouldStopPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    shouldStopPollingRef.current = true;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const maxPolls = 30; // 60 seconds max (30 polls * 2 seconds)
    shouldStopPollingRef.current = false;
    pollCountRef.current = 0;

    const fetchResults = async () => {
      if (shouldStopPollingRef.current) return;

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
        if (shouldStopPollingRef.current) return;

        setResults(data);
        setIsLoading(false);

        // Stop polling when complete or failed
        if (data.status === 'complete' || data.status === 'failed') {
          stopPolling();
          if (data.status === 'failed') {
            setError('We encountered an error processing your resume. Please contact support.');
          }
        }
      } catch (err) {
        if (shouldStopPollingRef.current) return;
        console.error('Error fetching results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load job results');
        setIsLoading(false);
        stopPolling();
      }
    };

    // Initial fetch
    fetchResults();

    // Set up polling
    pollIntervalRef.current = setInterval(() => {
      if (shouldStopPollingRef.current) {
        stopPolling();
        return;
      }

      pollCountRef.current++;
      setPollingCount(pollCountRef.current);

      // Stop polling after maxPolls attempts (60 seconds)
      if (pollCountRef.current >= maxPolls) {
        console.log('Max polling attempts reached, stopping');
        stopPolling();
        setError('Processing is taking longer than expected. Please refresh the page or contact support.');
        return;
      }

      fetchResults();
    }, 2000);

    // Cleanup
    return () => {
      stopPolling();
    };
  }, [sessionId, stopPolling]);

  // Loading state - processing
  if (isLoading || results?.status === 'processing' || results?.status === 'paid') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-5 h-5 bg-marty-orange rounded-full animate-bounce-loader mx-auto mb-8" />
          <h2 className="text-3xl font-bold text-marty-black mb-4 tracking-tight">
            Finding Your Matches
          </h2>
          <p className="text-gray-500 mb-2">
            Analyzing your resume and searching thousands of jobs...
          </p>
          <p className="text-sm text-gray-400">
            This usually takes 10-20 seconds
          </p>

          {/* Progress indicator */}
          <div className="mt-8 space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <span className="text-marty-orange font-bold">&#10003;</span>
              <span>Resume analyzed</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-marty-orange rounded-full animate-pulse" />
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
              Try Again
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

  // No jobs found
  if (results && results.jobs.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-marty-gray rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-marty-black mb-4 tracking-tight">
            No Matches Found
          </h1>
          <p className="text-gray-500 mb-2">
            We couldn't find jobs matching your resume right now.
          </p>
          <p className="text-sm text-gray-400 mb-10">
            We'll email you if we find relevant opportunities. Contact us for a refund.
          </p>
          <div className="space-y-4">
            <a
              href="mailto:support@jobmatch.com"
              className="block w-full px-6 py-4 bg-marty-black hover:bg-marty-orange text-white font-semibold rounded-full transition-all duration-300"
            >
              Contact Support
            </a>
            <a
              href="/"
              className="block w-full px-6 py-4 bg-marty-gray hover:bg-gray-200 text-marty-black font-medium rounded-full transition-colors"
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Success Header */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-marty-black mb-4 tracking-tighter">
            Your <span className="text-marty-orange">Matches</span> Are Ready
          </h1>
          <p className="text-lg text-gray-500 mb-2">
            {results!.jobs.length} jobs matched to your skills
          </p>
          {results!.email && (
            <p className="text-sm text-gray-400">
              Copy sent to <span className="font-medium">{results!.email}</span>
            </p>
          )}
        </div>

        {/* Job Results */}
        <div className="max-w-3xl mx-auto">
          <JobList jobs={results!.jobs} />
        </div>

        {/* Email Receipt Notice */}
        {results!.email && (
          <div className="max-w-3xl mx-auto mt-10 bg-marty-gray rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-marty-orange rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-marty-black mb-1">
                  Backup Sent to Your Email
                </h3>
                <p className="text-gray-500 text-sm">
                  A copy of all {results!.jobs.length} matches was sent to {results!.email} so you never lose them.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="max-w-3xl mx-auto mt-10 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Good luck with your job search!
          </p>
          <a
            href="/"
            className="inline-block text-sm text-marty-orange hover:underline"
          >
            Search for another resume
          </a>
        </div>
      </div>
    </div>
  );
}
