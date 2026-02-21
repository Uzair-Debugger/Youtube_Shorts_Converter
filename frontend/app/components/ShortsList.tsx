'use client';

import { useState, useCallback } from 'react';

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

interface ShortsListProps {
  jobId: string;
  shorts: Short[];
}

export default function ShortsList({ jobId, shorts }: ShortsListProps) {
  const [selectedShort, setSelectedShort] = useState<Short | null>(shorts.length > 0 ? shorts[0] : null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleDownload = useCallback(async (short: Short) => {
    if (!short.fileExists) {
      setError('Short file not found');
      return;
    }

    setDownloading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/download/${jobId}/${short.index - 1}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `short_${jobId}_${short.index}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      console.log(`Short ${short.index} downloaded successfully`);
      setDownloading(false);
    } catch (err: any) {
      setError(`Download error: ${err.message}`);
      console.error('Download error:', err);
      setDownloading(false);
    }
  }, [jobId, API_URL]);

  if (!shorts || shorts.length === 0) {
    return (
      <div className="p-6 bg-white/5 border border-white/20 rounded-lg text-center">
        <p className="text-gray-400">No shorts created yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Shorts Grid */}
      <div className="lg:col-span-2">
        <h3 className="text-2xl font-bold mb-6 text-white">
          All Shorts Created ({shorts.length})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shorts.map((short, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedShort(short)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                selectedShort?.index === short.index
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/20 bg-white/5 hover:border-purple-400/50'
              }`}
            >
              {/* Thumbnail placeholder */}
              <div className="w-full aspect-video bg-gradient-to-br from-purple-900 to-black rounded-lg mb-3 flex items-center justify-center">
                <span className="text-4xl font-bold text-purple-400">#{short.index}</span>
              </div>

              {/* Short info */}
              <h4 className="font-semibold text-white text-sm line-clamp-1 mb-2">
                {short.title || `Short ${short.index}`}
              </h4>
              
              <div className="text-xs text-gray-400 space-y-1">
                <p>Duration: {short.duration.toFixed(1)}s</p>
                <p>Size: {short.fileSizeInMB} MB</p>
                <p className={short.fileExists ? 'text-green-400' : 'text-red-400'}>
                  {short.fileExists ? '✓ Ready' : '✗ Missing'}
                </p>
              </div>

              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(short);
                }}
                disabled={!short.fileExists || downloading}
                className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all text-white"
              >
                {downloading ? 'Downloading...' : '⬇ Download'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <h3 className="text-xl font-bold mb-4 text-purple-400">Short Details</h3>
          
          {selectedShort ? (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6 space-y-4">
              {/* Short Number */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Short</p>
                <p className="text-3xl font-bold text-purple-400">#{selectedShort.index}</p>
              </div>

              {/* Title */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Title</p>
                <p className="text-white font-semibold text-sm">
                  {selectedShort.title}
                </p>
              </div>

              {/* Hook */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Hook</p>
                <p className="text-white/80 text-sm italic">
                  "{selectedShort.hook}"
                </p>
              </div>

              {/* Why Created */}
              <div>
                <p className="text-sm text-gray-400 mb-1">Why This Short?</p>
                <p className="text-white/70 text-xs leading-relaxed">
                  {selectedShort.reason}
                </p>
              </div>

              {/* Timing Info */}
              <div className="bg-white/5 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Start Time</span>
                  <span className="text-white font-mono">{selectedShort.startTime.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">End Time</span>
                  <span className="text-white font-mono">{selectedShort.endTime.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-xs border-t border-white/10 pt-2">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-mono font-bold">{selectedShort.duration.toFixed(1)}s</span>
                </div>
              </div>

              {/* File Info */}
              <div className="bg-white/5 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">File Size</span>
                  <span className="text-white">{selectedShort.fileSizeInMB} MB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Status</span>
                  <span className={selectedShort.fileExists ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                    {selectedShort.fileExists ? '✓ Ready' : '✗ Missing'}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(selectedShort)}
                disabled={!selectedShort.fileExists || downloading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all text-white transform hover:scale-105"
              >
                {downloading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⌛</span>
                    Downloading...
                  </>
                ) : (
                  <>
                    <span className="mr-2">⬇️</span>
                    Download Short
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-xs">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/20 rounded-lg p-6 text-center text-gray-400">
              <p>Select a short to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
