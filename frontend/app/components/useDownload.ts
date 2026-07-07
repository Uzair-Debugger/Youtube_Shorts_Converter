'use client';

import { useCallback, useRef, useState } from 'react';
import { tokenStorage, authApi } from '../../lib/auth';

interface Short {
  index: number;
  filename: string;
  fileExists: boolean;
  [key: string]: unknown;
}

interface DownloadHookReturn {
  downloadingIndex: number | null;
  error: string | null;
  downloadSingle: (jobId: string, short: Short) => Promise<void>;
  downloadBatch: (jobId: string, shorts: Short[]) => Promise<void>;
  clearError: () => void;
}

export function useDownload(): DownloadHookReturn {
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inProgress = useRef(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getToken = useCallback(async (): Promise<string | null> => {
    let token = tokenStorage.getAccessToken();
    if (token) return token;
    const refresh = tokenStorage.getRefreshToken();
    if (!refresh) return null;
    try {
      const data = await authApi.refresh(refresh);
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }, []);

  const downloadSingle = useCallback(async (jobId: string, short: Short) => {
    if (!short.fileExists) { setError('Short file not found'); return; }
    if (inProgress.current) return;

    inProgress.current = true;
    setDownloadingIndex(short.index as number);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${API_URL}/api/v1/job/download/${jobId}/${(short.index as number) - 1}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      triggerDownload(blob, `short_${jobId}_${short.index}.mp4`);
    } catch (err: unknown) {
      setError(`Download error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      inProgress.current = false;
      setDownloadingIndex(null);
    }
  }, [API_URL, getToken, triggerDownload]);

  const downloadBatch = useCallback(async (jobId: string, shorts: Short[]) => {
    const valid = shorts.filter(s => s.fileExists);
    if (valid.length === 0) { setError('No files available'); return; }
    if (inProgress.current) return;

    inProgress.current = true;
    setDownloadingIndex(-1);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/v1/job/download/${jobId}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shortIndices: valid.map(s => (s.index as number) - 1) }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any).error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      triggerDownload(blob, `shorts_${jobId}.zip`);
    } catch (err: unknown) {
      setError(`Batch download error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      inProgress.current = false;
      setDownloadingIndex(null);
    }
  }, [API_URL, getToken, triggerDownload]);

  const clearError = useCallback(() => setError(null), []);

  return { downloadingIndex, error, downloadSingle, downloadBatch, clearError };
}
