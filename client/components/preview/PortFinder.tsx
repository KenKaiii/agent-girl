/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * PortFinder - URL bar with recent history, port scanning, and online status
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  History,
  RefreshCw,
  Check,
  X,
  Loader2,
  ExternalLink,
  Trash2,
  Search,
} from 'lucide-react';

interface PortStatus {
  port: number;
  url: string;
  online: boolean;
  checking: boolean;
}

interface RecentUrl {
  url: string;
  timestamp: number;
  title?: string;
}

interface PortFinderProps {
  currentUrl: string | null;
  onUrlChange: (url: string) => void;
  onRefresh: () => void;
  isReloading?: boolean;
}

const COMMON_PORTS = [3000, 3001, 3002, 3003, 4000, 4321, 5000, 5173, 5174, 8000, 8080, 8888];
const STORAGE_KEY = 'agent-girl-recent-urls';
const MAX_RECENT_URLS = 10;

export function PortFinder({
  currentUrl,
  onUrlChange,
  onRefresh,
  isReloading = false,
}: PortFinderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [recentUrls, setRecentUrls] = useState<RecentUrl[]>([]);
  const [portStatuses, setPortStatuses] = useState<PortStatus[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'ports'>('recent');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent URLs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentUrls(Array.isArray(parsed) ? parsed : []);
      } catch {
        setRecentUrls([]);
      }
    }
  }, []);

  // Save current URL to recent history
  useEffect(() => {
    if (currentUrl) {
      setRecentUrls((prev) => {
        // Remove duplicate if exists
        const filtered = prev.filter((r) => r.url !== currentUrl);
        // Add to beginning
        const updated = [{ url: currentUrl, timestamp: Date.now() }, ...filtered];
        // Keep only MAX_RECENT_URLS
        const limited = updated.slice(0, MAX_RECENT_URLS);
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        return limited;
      });
    }
  }, [currentUrl]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if a port is online
  const checkPort = useCallback(async (port: number): Promise<boolean> => {
    const url = `http://localhost:${port}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      await fetch(url, { method: 'HEAD', signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Scan all common ports
  const scanPorts = useCallback(async () => {
    setIsScanning(true);
    // Get current app port to exclude
    const currentPort = parseInt(window.location.port) || 80;

    // Initialize all ports as checking
    const initialStatuses: PortStatus[] = COMMON_PORTS
      .filter((p) => p !== currentPort)
      .map((port) => ({
        port,
        url: `http://localhost:${port}`,
        online: false,
        checking: true,
      }));
    setPortStatuses(initialStatuses);

    // Check ports in parallel
    const results = await Promise.all(
      initialStatuses.map(async (status) => {
        const online = await checkPort(status.port);
        return { ...status, online, checking: false };
      })
    );

    // Sort: online first, then by port number
    results.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.port - b.port;
    });

    setPortStatuses(results);
    setIsScanning(false);
  }, [checkPort]);

  // Handle URL submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputValue.trim();
    if (!url) return;

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it's just a port number
      if (/^\d+$/.test(url)) {
        url = `http://localhost:${url}`;
      } else {
        url = `http://${url}`;
      }
    }

    onUrlChange(url);
    setInputValue('');
    setIsEditing(false);
    setIsOpen(false);
  };

  // Select a URL from the list
  const handleSelectUrl = (url: string) => {
    onUrlChange(url);
    setIsOpen(false);
    setIsEditing(false);
  };

  // Remove URL from history
  const handleRemoveRecent = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentUrls((prev) => {
      const updated = prev.filter((r) => r.url !== url);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all recent URLs
  const handleClearHistory = () => {
    setRecentUrls([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Extract display text from URL
  const getDisplayUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'localhost') {
        return `localhost:${parsed.port || 80}${parsed.pathname !== '/' ? parsed.pathname : ''}`;
      }
      return parsed.host + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch {
      return url;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {/* URL Bar */}
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-text"
          style={{
            background: isEditing || isOpen
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(255, 255, 255, 0.04)',
            border: isEditing || isOpen
              ? '1px solid rgba(59, 130, 246, 0.5)'
              : '1px solid transparent',
          }}
          onClick={() => {
            setIsOpen(true);
            if (!isEditing) {
              setInputValue(currentUrl || '');
              setIsEditing(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
        >
          {/* Icon: Globe or Search */}
          {isEditing ? (
            <Search size={14} className="text-blue-400 flex-shrink-0" />
          ) : (
            <Globe size={14} className="text-gray-500 flex-shrink-0" />
          )}

          {/* Input or Display */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setIsOpen(false);
                  setInputValue('');
                }
              }}
              placeholder="Enter URL or port number..."
              autoFocus
              className="flex-1 bg-transparent text-xs outline-none min-w-0"
              style={{ color: '#ccc' }}
            />
          ) : (
            <span
              className="flex-1 text-xs truncate"
              style={{ color: currentUrl ? '#888' : '#555' }}
            >
              {currentUrl ? getDisplayUrl(currentUrl) : 'Enter URL or scan ports...'}
            </span>
          )}

          {/* Actions */}
          {!isEditing && currentUrl && (
            <div className="flex items-center gap-1">
              {/* Refresh */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                style={{ color: isReloading ? '#3b82f6' : '#555' }}
                title="Refresh"
              >
                <RefreshCw size={12} className={isReloading ? 'animate-spin' : ''} />
              </button>
              {/* Open in new tab */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(currentUrl, '_blank');
                }}
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                style={{ color: '#555' }}
                title="Open in new tab"
              >
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-2xl z-50 overflow-hidden"
          style={{
            background: '#1a1a1e',
            border: '1px solid #333',
            minWidth: '320px',
          }}
        >
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('recent')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                color: activeTab === 'recent' ? '#fff' : '#666',
                background: activeTab === 'recent' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderBottom: activeTab === 'recent' ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <History size={12} />
              Recent
            </button>
            <button
              onClick={() => {
                setActiveTab('ports');
                if (portStatuses.length === 0) scanPorts();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                color: activeTab === 'ports' ? '#fff' : '#666',
                background: activeTab === 'ports' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderBottom: activeTab === 'ports' ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <Globe size={12} />
              Local Ports
            </button>
          </div>

          {/* Recent URLs Tab */}
          {activeTab === 'recent' && (
            <div className="max-h-[280px] overflow-y-auto">
              {recentUrls.length === 0 ? (
                <div className="p-4 text-center text-xs" style={{ color: '#666' }}>
                  No recent URLs
                </div>
              ) : (
                <>
                  {recentUrls.map((recent) => (
                    <button
                      key={recent.url}
                      onClick={() => handleSelectUrl(recent.url)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left group"
                    >
                      <Globe size={12} style={{ color: '#666' }} />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs truncate"
                          style={{
                            color: recent.url === currentUrl ? '#3b82f6' : '#ccc',
                          }}
                        >
                          {getDisplayUrl(recent.url)}
                        </div>
                        <div className="text-xs" style={{ color: '#555' }}>
                          {formatTime(recent.timestamp)}
                        </div>
                      </div>
                      {recent.url === currentUrl && (
                        <Check size={12} style={{ color: '#3b82f6' }} />
                      )}
                      <button
                        onClick={(e) => handleRemoveRecent(recent.url, e)}
                        className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: '#666' }}
                        title="Remove"
                      >
                        <X size={10} />
                      </button>
                    </button>
                  ))}
                  {/* Clear all */}
                  <div className="border-t border-white/10 p-2">
                    <button
                      onClick={handleClearHistory}
                      className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded hover:bg-red-500/10 transition-colors text-xs"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={11} />
                      Clear History
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Ports Tab */}
          {activeTab === 'ports' && (
            <div className="max-h-[280px] overflow-y-auto">
              {/* Scan button */}
              <div className="p-2 border-b border-white/10">
                <button
                  onClick={scanPorts}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-medium"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                  }}
                >
                  {isScanning ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  {isScanning ? 'Scanning...' : 'Scan Local Ports'}
                </button>
              </div>

              {/* Port list */}
              {portStatuses.length === 0 && !isScanning ? (
                <div className="p-4 text-center text-xs" style={{ color: '#666' }}>
                  Click scan to find local servers
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {portStatuses.map((status) => (
                    <button
                      key={status.port}
                      onClick={() => status.online && handleSelectUrl(status.url)}
                      disabled={!status.online || status.checking}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Status indicator */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: status.checking
                            ? '#888'
                            : status.online
                            ? '#22c55e'
                            : '#ef4444',
                          boxShadow: status.online && !status.checking
                            ? '0 0 6px rgba(34, 197, 94, 0.5)'
                            : undefined,
                        }}
                      />

                      {/* Port info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-mono"
                          style={{
                            color: status.online ? '#ccc' : '#666',
                          }}
                        >
                          localhost:{status.port}
                        </div>
                      </div>

                      {/* Status text */}
                      <div className="text-xs" style={{ color: '#555' }}>
                        {status.checking ? (
                          <span className="flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" />
                            checking
                          </span>
                        ) : status.online ? (
                          <span style={{ color: '#22c55e' }}>online</span>
                        ) : (
                          <span>offline</span>
                        )}
                      </div>

                      {/* Select indicator */}
                      {status.url === currentUrl && status.online && (
                        <Check size={12} style={{ color: '#3b82f6' }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick input hint */}
          <div
            className="px-3 py-2 text-xs border-t border-white/10"
            style={{ color: '#555' }}
          >
            Tip: Type a port number (e.g., "3000") or full URL
          </div>
        </div>
      )}
    </div>
  );
}
