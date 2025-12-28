'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import JobList from '@/components/JobList';
import { Job } from '@/lib/types';

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // In a real implementation, we'd fetch from an API endpoint
        // For now, this is a placeholder
        // The actual implementation will come when we connect everything

        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For now, show empty state as we haven't implemented the results API yet
        setJobs([]);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load job results');
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading your job matches...</p>
        </div>
      </div>
    );
  }

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
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Job Matches 🎯
          </h1>
          <p className="text-lg text-gray-700">
            Here are the top 5 jobs matched to your resume
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Check your email for 20 more opportunities!
          </p>
        </div>

        {/* Job Results */}
        <div className="max-w-4xl mx-auto">
          <JobList jobs={jobs.slice(0, 5)} />
        </div>

        {/* Email Notice */}
        {jobs.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  More Jobs Coming Soon!
                </h3>
                <p className="text-gray-700 text-sm">
                  We're sending 20 additional job matches to your email. They should arrive within the next 15-30 minutes.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
