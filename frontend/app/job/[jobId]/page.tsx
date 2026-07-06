'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { authApi, type JobStatusResponse, tokenStorage } from '../../../lib/auth';
import ProgressTracker from '../../components/ProgressTracker';

export default function JobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = typeof params.jobId === 'string' ? params.jobId : '';

  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await authApi.getJob(jobId);
      setJobStatus(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 2000);
    return () => clearInterval(interval);
  }, [fetchJob]);

  const handleDownload = useCallback(async () => {
    if (!jobId) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/job/download/${jobId}`, {
        headers: {
          Authorization: `Bearer ${tokenStorage.getAccessToken() || ''}`,
        },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `short_${jobId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <p className="text-gray-600">Loading job status...</p>
      </div>
    );
  }

  if (error || !jobStatus) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          <ProgressTracker
            jobStatus={{
              id: jobStatus.id,
              status: jobStatus.status,
              progress: jobStatus.progress,
              message: jobStatus.message,
            }}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </div>
  );
}
