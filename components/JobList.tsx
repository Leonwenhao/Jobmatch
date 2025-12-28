import { Job } from '@/lib/types';
import JobCard from './JobCard';

interface JobListProps {
  jobs: Job[];
  emptyMessage?: string;
}

export default function JobList({
  jobs,
  emptyMessage = "No jobs found matching your criteria."
}: JobListProps) {
  // Handle empty state
  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Matches Found
        </h3>
        <p className="text-gray-600 mb-4">
          {emptyMessage}
        </p>
        <p className="text-sm text-gray-500">
          We couldn't find matches for your profile right now.
          We'll email you if we find relevant jobs, or contact us for a refund.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Job count header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'} Found
        </h2>
        <div className="text-sm text-gray-600">
          Sorted by relevance
        </div>
      </div>

      {/* Job cards grid */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
