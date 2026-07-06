'use client';

import { useParams, useRouter } from 'next/navigation';
import ProgressTracker from '../../components/ProgressTracker';

export default function JobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = typeof params.jobId === 'string' ? params.jobId : '';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Job Status</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all"
            >
              New Job
            </button>
          </div>
          <ProgressTracker initialJobId={jobId} />
        </div>
      </div>
    </div>
  );
}