'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDownload } from './useDownload';

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
  const [selectedShorts, setSelectedShorts] = useState<Set<number>>(new Set());
  
  const { downloading, error, downloadSingle, downloadBatch, clearError } = useDownload();

  const toggleSelectShort = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedShorts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedShorts(newSelected);
  }, [selectedShorts]);

  const handleDownload = useCallback(async (short: Short) => {
    await downloadSingle(jobId, short);
  }, [jobId, downloadSingle]);

  const handleBatchDownload = useCallback(async () => {
    const shortsToDownload = shorts.filter(s => selectedShorts.has(s.index));
    await downloadBatch(jobId, shortsToDownload);
    setSelectedShorts(new Set());
  }, [jobId, shorts, selectedShorts, downloadBatch]);

  const handleSelectAll = useCallback(() => {
    const allIndices = shorts.filter(s => s.fileExists).map(s => s.index);
    const allSelected = allIndices.every(idx => selectedShorts.has(idx));
    setSelectedShorts(allSelected ? new Set() : new Set(allIndices));
  }, [shorts, selectedShorts]);

  if (!shorts || shorts.length === 0) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">No shorts created yet</p>
      </div>
    );
  }

  const selectedCount = selectedShorts.size;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Shorts Grid */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            All Shorts Created ({shorts.length})
          </h3>
          {selectedCount > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedShorts(new Set())}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
              <button
                onClick={handleBatchDownload}
                disabled={downloading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-all"
              >
                {downloading ? 'Downloading...' : `Download ${selectedCount} Selected`}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shorts.map((short, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedShort(short)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                selectedShort?.index === short.index
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              {/* Selection Reason Preview */}
              <div className="mb-2 text-xs text-gray-600 line-clamp-2">
                <span className="font-medium text-purple-600">Why: </span>
                {short.reason || 'AI-selected segment'}
              </div>

              {/* Thumbnail placeholder */}
              <div className="w-full aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-4xl font-bold text-purple-600">#{short.index}</span>
              </div>

              {/* Short info */}
              <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-2">
                {short.title || `Short ${short.index}`}
              </h4>
              
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Duration: {short.duration.toFixed(1)}s</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedShorts.has(short.index)}
                    onChange={() => {}}
                    onClick={(e) => toggleSelectShort(short.index, e)}
                    className="w-3 h-3 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span>Select</span>
                </label>
              </div>
              <p className={`text-xs ${short.fileExists ? 'text-green-600' : 'text-red-600'}`}>
                {short.fileExists ? '✓ Ready' : '✗ Missing'}
              </p>

              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(short);
                }}
                disabled={!short.fileExists || downloading}
                className="w-full mt-3 py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all text-white"
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
          <h3 className="text-xl font-bold mb-4 text-purple-600">Short Details</h3>
          
          {selectedShort ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              {/* Short Number */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Short</p>
                <p className="text-3xl font-bold text-purple-600">#{selectedShort.index}</p>
              </div>

              {/* Title */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Title</p>
                <p className="text-gray-900 font-semibold text-sm">
                  {selectedShort.title}
                </p>
              </div>

              {/* Hook */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Hook</p>
                <p className="text-gray-700 text-sm italic">
                  "{selectedShort.hook}"
                </p>
              </div>

              {/* Why Created */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Why This Short?</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {selectedShort.reason}
                </p>
              </div>

              {/* Timing Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Start Time</span>
                  <span className="text-gray-900 font-mono">{selectedShort.startTime.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">End Time</span>
                  <span className="text-gray-900 font-mono">{selectedShort.endTime.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-xs border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Duration</span>
                  <span className="text-gray-900 font-mono font-bold">{selectedShort.duration.toFixed(1)}s</span>
                </div>
              </div>

              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">File Size</span>
                  <span className="text-gray-900">{selectedShort.fileSizeInMB} MB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Status</span>
                  <span className={selectedShort.fileExists ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {selectedShort.fileExists ? '✓ Ready' : '✗ Missing'}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(selectedShort)}
                disabled={!selectedShort.fileExists || downloading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all text-white transform hover:scale-105"
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
                <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-red-800 text-xs">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-600">
              <p>Select a short to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}