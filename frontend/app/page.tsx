'use client';

import { useState, useCallback, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}

// Lazy load the ProgressTracker component for better performance
const ProgressTracker = dynamic(() => import('./components/ProgressTracker'), {
  loading: () => <ProgressTrackerSkeleton />,
  ssr: true
});

// Skeleton loader for progress tracker
function ProgressTrackerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" role="status" aria-label="Loading progress tracker">
      <div className="h-3 bg-white/10 rounded-full" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Memoized feature card component
const FeatureCard = memo(({ emoji, title, description }: { emoji: string; title: string; description: string }) => (
  <article className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
    <div className="text-4xl mb-4" role="img" aria-label={title}>
      {emoji}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </article>
));

FeatureCard.displayName = 'FeatureCard';

export default function Home() {
  const [url, setUrl] = useState('');
  const [noOfShorts, setNoOfShorts] = useState<number>(1)
  const [jobId, setJobId] = useState('');
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  // Store active polling interval ref for cleanup
  const pollIntervalRef = useCallback(() => null as unknown as ReturnType<typeof setInterval>, []);

  useEffect(() => {
    return () => {
      // No-op: intervals are cleared by their specific clear calls
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setJobStatus(null);

    try {
      console.log(`Frontend noOfShorts: ${noOfShorts}`)
      const response = await fetch(`${API_URL}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            youtubeUrl: url,
            noOfShorts: noOfShorts
          })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversion');
      }

      const data = await response.json();
      setJobId(data.jobId);
      startPolling(data.jobId);
    } catch (err: any) {
      setError(err);
      console.error('Conversion error:', err.message);
      setLoading(false);
    }
  }, [url, noOfShorts]); // missing noOfShorts dependecy led to state bug

  const startPolling = useCallback((id: string) => {
    let pollCount = 0;
    const maxPolls = 180; // 30 minutes max with exponential backoff

    const getPollInterval = (count: number): number => {
      // Start at 1s, increase to max 5s: 1s, 1.5s, 2s, 2.5s, 3s... 5s
      return Math.min(1000 + count * 500, 5000);
    };

    const poll = async () => {
      if (pollCount >= maxPolls) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/status/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const status: JobStatus = await response.json();
        console.log("Job Status: ", status)
        setJobStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          setLoading(false);
          return;
        }

        pollCount++;
        const nextInterval = getPollInterval(pollCount);
        setTimeout(poll, nextInterval);
      } catch (err) {
        console.error('Polling error:', err);
        setLoading(false);
      }
    };

    poll();
  }, []);

  const handleDownload = useCallback(async () => {
    if (!jobId) return;
    
    setDownloading(true);
    try {
      setError('');
      const response = await fetch(`${API_URL}/api/download/${jobId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `short_${jobId}.mp4`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('Download completed successfully');
      setDownloading(false);
    } catch (err: any) {
      setError(`Download error: ${err.message}`);
      console.error('Download error:', err);
      setDownloading(false);
    }
  }, [jobId]);

  return (
    <>
      {/* SEO Meta Tags - These should ideally be in a separate metadata export or Head component */}
      <div className="min-h-screen bg-white text-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Header with semantic HTML */}
          <header className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-purple-600">
              YouTube Shorts AI
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Transform any video into viral shorts with AI-powered analysis
            </p>
          </header>

          {/* Main Content */}
          <main>
            {/* Main Card with semantic article */}
            <article className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200">
              {/* Input Form with proper labels and ARIA */}
              <form onSubmit={handleSubmit} className="mb-8" noValidate>
                <div className="mb-4">

                  <label
                    htmlFor="youtube-url"
                    className="block text-sm font-medium mb-2"
                  >
                    YouTube Video URL
                  </label>
                  <div className='flex'>
                    <input
                      id="youtube-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
                      disabled={loading}
                      required
                      aria-required="true"
                      aria-invalid={error ? 'true' : 'false'}
                      aria-describedby={error ? 'url-error' : undefined}
                      autoComplete="url"
                    />

                    <input 
                    type="number" 
                    value={noOfShorts}
                    onChange={(e) => setNoOfShorts(Number(e.target.value))} 
                    className='w-20 mx-2 text-center p-1 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all' />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !url}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white"
                  aria-busy={loading}
                >
                  <span aria-hidden="true">🎬</span> {loading ? 'Processing...' : 'Create Short'}
                </button>
              </form>

              {/* Error Message with proper ARIA */}
              {error && (
                <div
                  id="url-error"
                  role="alert"
                  aria-live="polite"
                  className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg"
                >
                  <p className="text-red-800">
                    <span aria-hidden="true">❌</span> {error}
                  </p>
                </div>
              )}

              {/* Progress Tracker - Lazy loaded */}
              {jobStatus && (
                <ProgressTracker
                  jobStatus={jobStatus}
                  onDownload={handleDownload}
                  isDownloading={downloading}
                />
              )}
              {/* Loading Indicator */}
              {loading && !jobStatus && (
                <div className="mt-8 p-6 bg-purple-100 border border-purple-300 rounded-lg text-center">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                  </div>
                  <p className="text-purple-800 font-medium">Initializing conversion...</p>
                </div>
              )}
            </article>

            {/* Features Section with semantic HTML */}
            <section
              className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-8"
              aria-labelledby="features-heading"
            >
              <h2 id="features-heading" className="sr-only">Features</h2>

              <FeatureCard
                emoji="🤖"
                title="AI-Powered"
                description="Intelligent analysis finds the most engaging moments automatically"
              />

              <FeatureCard
                emoji="📱"
                title="Vertical Format"
                description="Perfect 9:16 aspect ratio optimized for mobile viewing"
              />

              <FeatureCard
                emoji="⚡"
                title="Fast & Free"
                description="Create professional shorts in minutes, completely free"
              />
            </section>
          </main>
        </div>
      </div>
    </>
  );
}