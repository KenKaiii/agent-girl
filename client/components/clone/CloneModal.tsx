/**
 * Clone Modal - Website cloning dialog
 * Allows users to input a URL and clone websites
 * Self-contained component with its own WebSocket connection
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Globe, X, Loader2, ExternalLink, FolderOpen, Copy } from 'lucide-react';
import { toast } from '../../utils/toast';
import { usePreview } from '../../context/PreviewContext';

interface CloneJob {
  id: string;
  url: string;
  status: 'pending' | 'cloning' | 'sanitizing' | 'serving' | 'complete' | 'error';
  progress: number;
  outputDir?: string;
  previewUrl?: string;
  error?: string;
}

interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generate a session ID for clone operations
const generateSessionId = () => `clone-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function CloneModal({ isOpen, onClose }: CloneModalProps) {
  const [url, setUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [currentJob, setCurrentJob] = useState<CloneJob | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const { openPreview } = usePreview();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // WebSocket connection for clone progress
  useEffect(() => {
    if (!isOpen) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Connection established
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Only handle clone messages for our session
        if (data.sessionId && data.sessionId !== sessionIdRef.current) return;

        if (data.type === 'clone_started') {
          setCurrentJob({
            id: data.jobId,
            url: data.url,
            status: data.status,
            progress: 0,
          });
        } else if (data.type === 'clone_progress') {
          setCurrentJob(prev => prev ? {
            ...prev,
            status: data.status || prev.status,
            progress: data.progress || prev.progress,
          } : null);
        } else if (data.type === 'clone_complete') {
          setCurrentJob(prev => prev ? {
            ...prev,
            status: 'complete',
            progress: 100,
            outputDir: data.htmlDir,
            previewUrl: data.previewUrl,
          } : null);
          setIsCloning(false);

          // Auto-open preview
          if (data.previewUrl) {
            openPreview(data.previewUrl);
            toast.success('Website cloned!', {
              description: `Preview: ${data.previewUrl}`,
            });
          }
        } else if (data.type === 'clone_error') {
          setCurrentJob(prev => prev ? {
            ...prev,
            status: 'error',
            error: data.error,
          } : null);
          setIsCloning(false);
          toast.error('Clone failed', { description: data.error });
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    ws.onerror = () => {
      // WebSocket error - will fall back to REST API
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isOpen, openPreview]);

  const handleClone = useCallback(async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Validate URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      new URL(targetUrl);
    } catch {
      toast.error('Invalid URL', { description: 'Please enter a valid website URL' });
      return;
    }

    setIsCloning(true);
    setCurrentJob({
      id: '',
      url: targetUrl,
      status: 'pending',
      progress: 0,
    });

    const ws = wsRef.current;
    const sessionId = sessionIdRef.current;

    // Use WebSocket if available, otherwise fall back to REST API
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'clone_quick',
        sessionId,
        url: targetUrl,
        port: 4321,
      }));
    } else {
      // Fallback to REST API
      try {
        const response = await fetch('/api/clone/quick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, port: 4321 }),
        });

        if (response.ok) {
          const result = await response.json();
          setCurrentJob({
            id: result.jobId || '',
            url: targetUrl,
            status: 'complete',
            progress: 100,
            outputDir: result.htmlDir,
            previewUrl: result.previewUrl,
          });
          setIsCloning(false);

          if (result.previewUrl) {
            openPreview(result.previewUrl);
            toast.success('Website cloned!', {
              description: `Preview: ${result.previewUrl}`,
            });
          }
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Clone failed');
        }
      } catch (err) {
        setIsCloning(false);
        toast.error('Clone failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  }, [url, openPreview]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCloning) {
      handleClone();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleClone, isCloning, onClose]);

  const handleOpenFolder = useCallback(async () => {
    if (!currentJob?.outputDir) return;

    try {
      const response = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentJob.outputDir }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Opened folder');
      } else {
        toast.error('Failed to open folder', { description: data.error });
      }
    } catch {
      toast.error('Failed to open folder');
    }
  }, [currentJob?.outputDir]);

  const handleCopyPath = useCallback(async () => {
    if (!currentJob?.outputDir) return;

    try {
      await navigator.clipboard.writeText(currentJob.outputDir);
      toast.success('Path copied');
    } catch {
      toast.error('Failed to copy path');
    }
  }, [currentJob?.outputDir]);

  if (!isOpen) return null;

  const statusText: Record<string, string> = {
    pending: 'Preparing...',
    cloning: 'Downloading website...',
    sanitizing: 'Cleaning assets...',
    serving: 'Starting preview server...',
    complete: 'Clone complete!',
    error: 'Clone failed',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'rgb(var(--bg-secondary))',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: '480px',
          margin: '0 16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={20} style={{ color: 'rgb(59, 130, 246)' }} />
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Clone Website</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'rgb(var(--text-secondary))',
              borderRadius: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* URL Input */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                color: 'rgb(var(--text-secondary))',
                marginBottom: '8px',
              }}
            >
              Website URL
            </label>
            <input
              ref={inputRef}
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCloning}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: 'rgb(var(--text-primary))',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            />
          </div>

          {/* Progress / Status */}
          {currentJob && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                background: currentJob.status === 'error'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : currentJob.status === 'complete'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: `1px solid ${
                  currentJob.status === 'error'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : currentJob.status === 'complete'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {isCloning && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {statusText[currentJob.status] || currentJob.status}
                </span>
              </div>

              {/* Progress bar */}
              {isCloning && (
                <div
                  style={{
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${currentJob.progress}%`,
                      background: 'rgb(59, 130, 246)',
                      borderRadius: '2px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              )}

              {/* Success actions */}
              {currentJob.status === 'complete' && currentJob.previewUrl && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => openPreview(currentJob.previewUrl!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      color: 'rgb(59, 130, 246)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={14} />
                    Open Preview
                  </button>
                  <button
                    onClick={handleOpenFolder}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: 'rgb(var(--text-secondary))',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <FolderOpen size={14} />
                    Open Folder
                  </button>
                  <button
                    onClick={handleCopyPath}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: 'rgb(var(--text-secondary))',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Copy size={14} />
                    Copy Path
                  </button>
                </div>
              )}

              {/* Error message */}
              {currentJob.status === 'error' && currentJob.error && (
                <p style={{ fontSize: '12px', color: 'rgb(239, 68, 68)', marginTop: '8px' }}>
                  {currentJob.error}
                </p>
              )}
            </div>
          )}

          {/* Clone Button */}
          <button
            onClick={handleClone}
            disabled={isCloning || !url.trim()}
            style={{
              width: '100%',
              padding: '12px',
              background: isCloning || !url.trim()
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgb(59, 130, 246)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isCloning || !url.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            {isCloning ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Cloning...
              </>
            ) : (
              <>
                <Globe size={18} />
                Clone Website
              </>
            )}
          </button>

          {/* Info text */}
          <p
            style={{
              fontSize: '12px',
              color: 'rgb(var(--text-secondary))',
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            Downloads HTML, CSS, JS, and images for offline viewing
          </p>
        </div>
      </div>
    </div>
  );
}
