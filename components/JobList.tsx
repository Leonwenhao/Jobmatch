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
      <div className="bg-marty-gray rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-marty-black mb-2">
          No Matches Found
        </h3>
        <p className="text-gray-500 text-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Job count header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-marty-black border-b-2 border-marty-orange pb-1 inline-block">
          {jobs.length} {jobs.length === 1 ? 'Match' : 'Matches'} Found
        </h2>
      </div>

      {/* Job cards */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
