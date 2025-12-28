import { Job } from '@/lib/types';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      {/* Job Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {job.title}
      </h3>

      {/* Company */}
      <div className="flex items-center gap-2 text-gray-700 mb-2">
        <span className="text-lg">🏢</span>
        <span className="font-medium">{job.company}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-gray-600 mb-3">
        <span className="text-lg">📍</span>
        <span>{job.location}</span>
      </div>

      {/* Salary (if available) */}
      {job.salary && (
        <div className="flex items-center gap-2 text-green-700 mb-3">
          <span className="text-lg">💰</span>
          <span className="font-medium">{job.salary}</span>
        </div>
      )}

      {/* Description Preview (if available) */}
      {job.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}
          {job.description.length > 150 ? '...' : ''}
        </p>
      )}

      {/* Apply Button */}
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
      >
        <span>Apply Now</span>
        <span className="ml-2">→</span>
      </a>
    </div>
  );
}
