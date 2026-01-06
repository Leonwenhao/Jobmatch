import { Job } from '@/lib/types';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 hover:border-marty-orange hover:shadow-lg hover:shadow-orange-100 hover:-translate-y-0.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Job Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-marty-black mb-1 truncate">
          {job.title}
        </h3>
        <p className="text-gray-500 text-sm">
          {job.company}
          {job.location && <span> &bull; {job.location}</span>}
          {job.salary && <span className="text-marty-orange font-medium"> &bull; {job.salary}</span>}
        </p>

        {/* Description Preview (if available) */}
        {job.description && (
          <p className="text-gray-400 text-sm mt-2 line-clamp-1 hidden md:block">
            {job.description.replace(/<[^>]*>/g, '').substring(0, 100)}
            {job.description.length > 100 ? '...' : ''}
          </p>
        )}
      </div>

      {/* Apply Button */}
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center px-6 py-3 bg-marty-black hover:bg-marty-orange text-white text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap"
      >
        Apply Now
      </a>
    </div>
  );
}
