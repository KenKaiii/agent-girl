/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useEffect, useRef, useState, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MessageRenderer } from '../message/MessageRenderer';
import { Zap, Clock } from 'lucide-react';
import type { Message } from '../message/types';

// Memoized message item to prevent unnecessary re-renders
const MemoizedMessageItem = memo(function MemoizedMessageItem({
  message,
  displayMode,
  showCode,
  onRemoveMessage,
}: {
  message: Message;
  displayMode?: 'full' | 'compact';
  showCode: boolean;
  onRemoveMessage?: (messageId: string) => void;
}) {
  return <MessageRenderer message={message} displayMode={displayMode} showCode={showCode} onRemoveMessage={onRemoveMessage} />;
});

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  liveTokenCount?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  displayMode?: 'full' | 'compact';
  showCode?: boolean;
  onRemoveMessage?: (messageId: string) => void;
}

export const MessageList = memo(function MessageList({ messages, isLoading, liveTokenCount = 0, scrollContainerRef, displayMode, showCode = true, onRemoveMessage }: MessageListProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const parentRef = scrollContainerRef || internalRef;
  const bottomRef = useRef<HTMLDivElement>(null);

  // Elapsed time tracking
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  // Token count display (debounced)
  const [displayedTokenCount, setDisplayedTokenCount] = useState(0);

  // Smart scrolling - track if user is at bottom
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isUserScrollingRef = useRef(false);

  // Track elapsed time when loading
  useEffect(() => {
    if (isLoading) {
      // Start timer
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);

      const interval = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset timer when loading stops
      startTimeRef.current = null;
      setElapsedSeconds(0);
    }
  }, [isLoading]);

  // Simplified token count update - no animation to reduce CPU overhead
  useEffect(() => {
    // Debounce updates to avoid excessive re-renders during fast streaming
    const timeout = setTimeout(() => {
      setDisplayedTokenCount(liveTokenCount);
    }, 100);
    return () => clearTimeout(timeout);
  }, [liveTokenCount]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated message height - will auto-adjust
    overscan: 5, // Render 5 extra items above/below viewport
  });

  // Smart scroll: detect if user is at bottom
  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Calculate if at bottom (with 100px threshold for slight scrolling)
      const isNowAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setIsAtBottom(isNowAtBottom);
      isUserScrollingRef.current = true;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom only if user is at bottom - debounced for performance
  useEffect(() => {
    if (parentRef.current && isAtBottom) {
      // Use 'auto' instead of 'smooth' during streaming for better performance
      requestAnimationFrame(() => {
        parentRef.current?.scrollTo({
          top: parentRef.current.scrollHeight,
          behavior: 'auto',
        });
      });
    }
  }, [messages.length, isAtBottom]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="empty-state">
          <h2 className="empty-state-title">Welcome to Agent Girl Chat</h2>
          <p className="empty-state-description">
            Start a conversation with Claude. I can help you with coding, analysis, and complex tasks
            using the Agent SDK tools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="flex overflow-auto z-10 flex-col flex-auto justify-between pb-2.5 w-full max-w-full h-0 min-h-0 scrollbar-hidden"
    >
      <div className="flex flex-col w-full h-full min-h-0">
        <div className="h-full min-h-0 flex pt-8">
          <div className="pt-2 w-full">
            <div className="w-full" style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const message = messages[virtualItem.index];

                return (
                  <div
                    key={message.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    ref={virtualizer.measureElement}
                    data-index={virtualItem.index}
                    data-message-index={virtualItem.index}
                  >
                    <MemoizedMessageItem message={message} displayMode={displayMode} showCode={showCode} onRemoveMessage={onRemoveMessage} />
                  </div>
                );
              })}
            </div>
            {isLoading && (
              <div className="message-container">
                <div className="loading-indicator-wrapper" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap' }}>
                  <div className="loading-dots">
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>

                  {/* Elapsed time indicator - changes to amber after 60s */}
                  {elapsedSeconds > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.625rem',
                        background: elapsedSeconds >= 60
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(218, 238, 255, 0.1) 0%, rgba(218, 238, 255, 0.05) 100%)',
                        border: elapsedSeconds >= 60
                          ? '1px solid rgba(245, 158, 11, 0.25)'
                          : '1px solid rgba(218, 238, 255, 0.15)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                        boxShadow: elapsedSeconds >= 60
                          ? '0 0 0 1px rgba(245, 158, 11, 0.15), 0 2px 8px rgba(245, 158, 11, 0.12)'
                          : '0 0 0 1px rgba(218, 238, 255, 0.1), 0 2px 8px rgba(218, 238, 255, 0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Clock
                        size={12}
                        strokeWidth={2.5}
                        style={{
                          color: elapsedSeconds >= 60 ? 'rgb(245, 158, 11)' : 'rgb(218, 238, 255)',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: elapsedSeconds >= 60 ? 'rgb(245, 158, 11)' : 'rgb(218, 238, 255)',
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {elapsedSeconds}s
                      </span>
                    </div>
                  )}

                  {/* Token count indicator */}
                  {displayedTokenCount > 0 && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.625rem',
                        background: 'linear-gradient(135deg, rgba(218, 238, 255, 0.1) 0%, rgba(218, 238, 255, 0.05) 100%)',
                        border: '1px solid rgba(218, 238, 255, 0.15)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 0 0 1px rgba(218, 238, 255, 0.1), 0 2px 8px rgba(218, 238, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Zap
                        size={12}
                        strokeWidth={2.5}
                        style={{
                          color: 'rgb(218, 238, 255)',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'rgb(218, 238, 255)',
                          fontVariantNumeric: 'tabular-nums',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {displayedTokenCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="pb-12" />
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
});
