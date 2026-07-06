'use client';

import { useCallback, useState } from 'react';
import { authenticatedFetch, tokenStorage, authApi } from '../../lib/auth';

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

interface DownloadHookReturn {
  downloading: boolean;
  error: string | null;
  downloadSingle: (jobId: string, short: Short) => Promise<void>;
  downloadBatch: (jobId: string, shorts: Short[]) => Promise<void>;
  clearError: () => void;
}

export function useDownload(): DownloadHookReturn {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = tokenStorage.getAccessToken();
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refresh = tokenStorage.getRefreshToken();
      if (refresh) {
        const data = await authApi.refresh(refresh);
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        token = data.accessToken;
        const newHeaders = new Headers(options.headers);
        newHeaders.set('Authorization', `Bearer ${token}`);
        response = await fetch(url, { ...options, headers: newHeaders });
      }
    }
    return response;
  }, []);

  const downloadSingle = useCallback(async (jobId: string, short: Short) => {
    if (!short.fileExists) {
      setError('Short file not found');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/v1/job/download/${jobId}/${short.index - 1}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      triggerDownload(blob, `short_${jobId}_${short.index}.mp4`);
    } catch (err: any) {
      setError(`Download error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }, [API_URL, triggerDownload, fetchWithAuth]);

  const downloadBatch = useCallback(async (jobId: string, shorts: Short[]) => {
    const validShorts = shorts.filter(s => s.fileExists);
    if (validShorts.length === 0) {
      setError('No short files available for download');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/v1/job/download/${jobId}/batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            shortIndices: validShorts.map(s => s.index - 1) 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch download failed');
      }

      const blob = await response.blob();
      triggerDownload(blob, `shorts_${jobId}.zip`);
    } catch (err: any) {
      setError(`Batch download error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }, [API_URL, triggerDownload, fetchWithAuth]);

  const clearError = useCallback(() => setError(null), []);

  return { downloading, error, downloadSingle, downloadBatch, clearError };
}