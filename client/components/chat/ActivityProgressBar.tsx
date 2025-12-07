/**
 * ActivityProgressBar - Slim progress indicator showing current AI activity
 * Displays what the AI is doing (thinking, writing, reading, etc.) with elapsed time
 */

import React, { memo, useEffect, useState, useRef } from 'react';
import { Loader2, Brain, Code2, Search, FileEdit, Terminal, Globe, CheckCircle2, Zap } from 'lucide-react';
import type { AIProgressState } from './ChatContainer';

interface ActivityProgressBarProps {
  progress: AIProgressState;
  isGenerating: boolean;
}

// Get icon for tool type
const getToolIcon = (tool?: string, status?: string) => {
  if (status === 'thinking' || !tool) {
    return <Brain className="w-3.5 h-3.5" />;
  }

  const lowerTool = tool.toLowerCase();

  if (lowerTool.includes('read') || lowerTool.includes('glob') || lowerTool.includes('grep')) {
    return <Search className="w-3.5 h-3.5" />;
  }
  if (lowerTool.includes('edit') || lowerTool.includes('write') || lowerTool.includes('notebook')) {
    return <FileEdit className="w-3.5 h-3.5" />;
  }
  if (lowerTool.includes('bash') || lowerTool.includes('terminal') || lowerTool.includes('shell')) {
    return <Terminal className="w-3.5 h-3.5" />;
  }
  if (lowerTool.includes('web') || lowerTool.includes('fetch') || lowerTool.includes('browser')) {
    return <Globe className="w-3.5 h-3.5" />;
  }
  if (lowerTool.includes('task')) {
    return <Zap className="w-3.5 h-3.5" />;
  }

  return <Code2 className="w-3.5 h-3.5" />;
};

// Get display text for status
const getStatusText = (progress: AIProgressState): string => {
  if (progress.status === 'completed') return 'Done';
  if (progress.status === 'error') return 'Error';
  if (progress.toolDisplayName) return progress.toolDisplayName;
  if (progress.status === 'thinking') return 'Thinking';
  if (progress.status === 'writing') return 'Writing';
  if (progress.status === 'tool_use') return 'Working';
  return 'Processing';
};

// Format elapsed time
const formatElapsed = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
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
  const Icon = progress.status === 'completed' ? CheckCircle2 : null;

  return (
    <div
      className="activity-progress-bar"
      style={{
        opacity: isGenerating ? 1 : 0.5,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.3s ease-out',
      }}
    >
      {/* Animated gradient background */}
      <div className="activity-progress-gradient" />

      {/* Content */}
      <div className="activity-progress-content">
        {/* Left: Status with icon */}
        <div className="activity-progress-status">
          {isGenerating ? (
            <div className="activity-progress-icon spinning">
              <Loader2 className="w-3.5 h-3.5" />
            </div>
          ) : Icon ? (
            <div className="activity-progress-icon done">
              <Icon className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="activity-progress-icon">
              {getToolIcon(progress.currentTool, progress.status)}
            </div>
          )}
          <span className="activity-progress-text">{statusText}</span>
          {progress.currentFile && (
            <span className="activity-progress-file">
              {progress.currentFile.split('/').pop()}
            </span>
          )}
        </div>

        {/* Right: Elapsed time */}
        <div className="activity-progress-time">
          {formatElapsed(elapsedTime)}
        </div>
      </div>

      {/* Animated progress line */}
      {isGenerating && (
        <div className="activity-progress-line">
          <div className="activity-progress-line-inner" />
        </div>
      )}
    </div>
  );
});
