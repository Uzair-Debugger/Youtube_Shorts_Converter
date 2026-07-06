'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { authenticatedFetch } from '../../lib/auth';

interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}

interface Short {
  index: number;
  filename: string;
  startTime: number;
  endTime: number;
  duration: number;
  title: string;
  reason: string;
  hook: string;
  fileSize: number;
  fileSizeInMB: string;
  fileExists: boolean;
}

interface ProgressTrackerProps {
  initialJobId: string;
}

// Lazy load ShortsList component
const ShortsList = dynamic(() => import('./ShortsList'), {
  loading: () => <div className="p-6 bg-white/5 rounded-lg text-center">Loading shorts...</div>,
  ssr: true
});

// Memoized status card component
const StatusCard = memo(({ label, isComplete }: { label: string; isComplete: boolean }) => {
  const getStatusText = () => {
    if (isComplete) return 'Complete';

    switch (label) {
      case 'AI Analysis':
        return 'Analyzing...';
      case 'Processing':
        return 'Processing...';
      case 'Finalization':
        return 'Almost...';
      default:
        return 'Waiting...';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg ${isComplete ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'
        } border transition-colors duration-300`}
      role="status"
      aria-label={`${label}: ${isComplete ? 'Complete' : 'In progress'}`}
    >
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-lg font-semibold text-gray-900">
        {isComplete ? (
          <>
            <span aria-hidden="true">✓</span> Complete
          </>
        ) : (
          <>
            <span aria-hidden="true">⏳</span> {getStatusText()}
          </>
        )}
      </div>
    </div>
  );
});

StatusCard.displayName = 'StatusCard';

function ProgressTracker({ initialJobId }: ProgressTrackerProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loadingShorts, setLoadingShorts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchJob = useCallback(async (stopPolling?: () => void) => {
    if (!initialJobId) return;
    try {
      const response = await authenticatedFetch(`${API_URL}/api/v1/job/status/${initialJobId}`);
      if (response.ok) {
        const data = await response.json();
        setJobStatus(data);
        setError('');
        if (data.status === 'completed' || data.status === 'failed') {
          stopPolling?.();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  }, [initialJobId, API_URL]);

  useEffect(() => {
    const interval = setInterval(() => fetchJob(() => clearInterval(interval)), 4000);
    fetchJob(() => clearInterval(interval));
    return () => clearInterval(interval);
  }, [fetchJob]);

  // Fetch shorts when job is completed
  useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.id) {
      const fetchShorts = async () => {
        setLoadingShorts(true);
        try {
          const response = await authenticatedFetch(`${API_URL}/api/v1/job/shorts/${jobStatus.id}`);
          if (response.ok) {
            const data = await response.json();
            setShorts(data.shorts || []);
          }
        } catch (error) {
          console.error('Error fetching shorts:', error);
        } finally {
          setLoadingShorts(false);
        }
      };

      fetchShorts();
    }
  }, [jobStatus?.status, jobStatus?.id, API_URL]);

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
        </div>
      </div>
    );
  }

  return (
    <section aria-live="polite" aria-atomic="true">
      <div className="space-y-4">
        {/* Progress Bar with ARIA */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-red-600">{jobStatus.message}</span>
            <span className="text-purple-600" aria-label={`Progress: ${jobStatus.progress} percent`}>
              {jobStatus.progress}%
            </span>
          </div>
          <div
            className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"
            role="progressbar"
            aria-valuenow={jobStatus.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Conversion progress"
          >
            <div
              className="bg-purple-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${jobStatus.progress}%` }}
            />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <StatusCard
            label="Download"
            isComplete={jobStatus.progress >= 20}
          />
          <StatusCard
            label="AI Analysis"
            isComplete={jobStatus.progress >= 50}
          />
          <StatusCard
            label="Processing"
            isComplete={jobStatus.progress >= 75}
          />
          <StatusCard
            label="Finalization"
            isComplete={jobStatus.status === 'completed'}
          />
        </div>

        {/* Shorts List - Show when completed */}
        {jobStatus.status === 'completed' && (
          <>
            {loadingShorts ? (
              <div className="p-6 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">Loading shorts...</p>
              </div>
            ) : shorts.length > 0 ? (
              <ShortsList jobId={jobStatus.id} shorts={shorts} />
            ) : null}
          </>
        )}

        {/* Failure Message */}
        {jobStatus.status === 'failed' && (
          <div
            role="alert"
            className="p-4 bg-red-100 border border-red-300 rounded-lg"
          >
            <p className="text-red-800">
              <span aria-hidden="true">❌</span> Processing failed. {jobStatus.message}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(ProgressTracker);