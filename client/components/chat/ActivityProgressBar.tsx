/**
 * ActivityProgressBar - Compact progress indicator showing current AI activity
 * Displays: Zap icon + status text, files edited count, elapsed time
 */

import React, { memo, useEffect, useState, useRef } from 'react';
import { Zap, FilePen, Clock } from 'lucide-react';
import type { AIProgressState } from './ChatContainer';

interface ActivityProgressBarProps {
  progress: AIProgressState;
  isGenerating: boolean;
}

// Get status text for display
const getStatusText = (progress: AIProgressState): string => {
  if (progress.status === 'completed') return 'Done';
  if (progress.status === 'error') return 'Error';
  if (progress.toolDisplayName) return `${progress.toolDisplayName}...`;
  if (progress.status === 'thinking') return 'Thinking...';
  if (progress.status === 'writing') return 'Writing...';
  if (progress.status === 'tool_use') return 'Working...';
  return 'Processing...';
};

// Format elapsed time
const formatElapsed = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
};

export const ActivityProgressBar = memo(function ActivityProgressBar({
  progress,
  isGenerating,
}: ActivityProgressBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Track elapsed time
  useEffect(() => {
    if (isGenerating && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    if (isGenerating) {
      setIsVisible(true);
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
      }, 100);
    } else {
      // Fade out after completion
      const timeout = setTimeout(() => {
        setIsVisible(false);
        startTimeRef.current = null;
        setElapsedTime(0);
      }, 800);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return () => clearTimeout(timeout);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isGenerating]);

  // Don't render if not visible
  if (!isVisible && !isGenerating) {
    return null;
  }

  const statusText = getStatusText(progress);
  const filesEdited = progress.editedFilesCount || 0;

  return (
    <div
      className="flex justify-center py-2"
      style={{
        opacity: isGenerating ? 1 : 0.5,
        transform: isVisible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'all 0.3s ease-out',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))',
          border: '1px solid rgba(251, 191, 36, 0.3)',
        }}
      >
        {/* Zap icon with animation */}
        <Zap
          size={12}
          className="animate-pulse"
          style={{ color: 'rgb(251, 191, 36)' }}
          aria-hidden="true"
        />

        {/* Status text */}
        <span
          className="text-xs font-medium"
          style={{ color: 'rgb(252, 211, 77)' }}
        >
          {statusText}
        </span>

        {/* Files edited count - only show if > 0 */}
        {filesEdited > 0 && (
          <div
            className="flex items-center gap-0.5"
            style={{ color: 'rgb(134, 239, 172)' }}
          >
            <FilePen size={10} aria-hidden="true" />
            <span className="text-xs">{filesEdited}</span>
          </div>
        )}

        {/* Elapsed time */}
        <div
          className="flex items-center gap-0.5"
          style={{ color: 'rgb(156, 163, 175)' }}
        >
          <Clock size={10} aria-hidden="true" />
          <span className="text-xs font-mono">{formatElapsed(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
});
