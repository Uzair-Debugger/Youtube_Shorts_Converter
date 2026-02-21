'use client';

import { memo, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

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
  jobStatus: JobStatus;
  onDownload: () => void;
  isDownloading?: boolean;
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
      className={`p-4 rounded-lg ${
        isComplete ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/20'
      } border transition-colors duration-300`}
      role="status"
      aria-label={`${label}: ${isComplete ? 'Complete' : 'In progress'}`}
    >
      <div className="text-sm text-gray-300">{label}</div>
      <div className="text-lg font-semibold">
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

function ProgressTracker({ jobStatus, onDownload, isDownloading = false }: ProgressTrackerProps) {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loadingShorts, setLoadingShorts] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Fetch shorts when job is completed
  useEffect(() => {
    if (jobStatus.status === 'completed' && jobStatus.id) {
      const fetchShorts = async () => {
        setLoadingShorts(true);
        try {
          const response = await fetch(`${API_URL}/api/shorts/${jobStatus.id}`);
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
  }, [jobStatus.status, jobStatus.id, API_URL]);

  return (
    <section aria-live="polite" aria-atomic="true">
      <div className="space-y-4">
        {/* Progress Bar with ARIA */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{jobStatus.message}</span>
            <span className="text-purple-300" aria-label={`Progress: ${jobStatus.progress} percent`}>
              {jobStatus.progress}%
            </span>
          </div>
          <div 
            className="w-full bg-white/10 rounded-full h-3 overflow-hidden"
            role="progressbar"
            aria-valuenow={jobStatus.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Conversion progress"
          >
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 rounded-full"
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
              <div className="p-6 bg-white/5 rounded-lg text-center">
                <p className="text-gray-400">Loading shorts...</p>
              </div>
            ) : shorts.length > 0 ? (
              <ShortsList jobId={jobStatus.id} shorts={shorts} />
            ) : null}
          </>
        )}

        {/* Download Button (Legacy - for first short) */}
        {jobStatus.status === 'completed' && shorts.length === 0 && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Download your completed short video"
            aria-busy={isDownloading}
          >
            {isDownloading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span> Downloading...
              </>
            ) : (
              <>
                <span aria-hidden="true">⬇️</span> Download Your Short
              </>
            )}
          </button>
        )}

        {/* Failure Message */}
        {jobStatus.status === 'failed' && (
          <div 
            role="alert"
            className="p-4 bg-red-500/20 border border-red-500 rounded-lg"
          >
            <p className="text-red-200">
              <span aria-hidden="true">❌</span> Processing failed. Please try another video or check the URL.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(ProgressTracker);