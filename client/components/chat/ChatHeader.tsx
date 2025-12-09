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

import React from 'react';
import { ModelSelector } from '../header/ModelSelector';
import { WorkingDirectoryDisplay } from '../header/WorkingDirectoryDisplay';
import { AboutButton } from '../header/AboutButton';
import { RadioPlayer } from '../header/RadioPlayer';
import {
  Menu,
  Edit3,
  ChevronLeft,
  ChevronRight,
  History,
  ExternalLink,
  Eye,
  EyeOff,
  Code2,
  Monitor,
  MessageSquare,
  Search,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { Session } from '../../hooks/useSessionAPI';
import type { Message } from '../message/types';

interface ChatHeaderProps {
  // Layout & UI state
  layoutMode: 'chat-only' | 'split-screen';
  isSidebarOpen: boolean;
  isMobile: boolean;
  onLayoutModeChange?: (mode: 'chat-only' | 'split-screen') => void;
  previewUrl?: string | null;
  onDetectPreviewUrl?: () => void;

  // Session management
  sessions: Session[];
  currentSessionId: string | null;
  navigationHistory: string[];

  // Model & messages
  selectedModel: string;
  messages: Message[];
  onModelChange: (model: string) => void;

  // Mode toggles
  isPlanMode: boolean;
  isConnected: boolean;

  // Display toggles
  showCode: boolean;
  displayMode: 'full' | 'compact';
  showSearchBar: boolean;
  searchQuery: string;
  searchMatches: number[];
  currentMatchIndex: number;

  // Handlers
  handleNewChat: () => void;
  handlePrevChat: () => void;
  handleNextChat: () => void;
  handleBackToRecent: () => void;
  handleChangeDirectory: (sessionId: string, newDir: string) => Promise<void>;
  setIsSidebarOpen: (open: boolean) => void;
  setShowCode: (show: boolean) => void;
  setDisplayMode: (mode: 'full' | 'compact') => void;
  setShowSearchBar: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchMatches: (matches: number[]) => void;
  setCurrentMatchIndex: (index: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function ChatHeader({
  layoutMode,
  isSidebarOpen,
  isMobile,
  onLayoutModeChange,
  previewUrl,
  onDetectPreviewUrl,
  sessions,
  currentSessionId,
  navigationHistory,
  selectedModel,
  messages,
  onModelChange,
  isPlanMode,
  isConnected,
  showCode,
  displayMode,
  showSearchBar,
  searchQuery,
  searchMatches,
  currentMatchIndex,
  handleNewChat,
  handlePrevChat,
  handleNextChat,
  handleBackToRecent,
  handleChangeDirectory,
  setIsSidebarOpen,
  setShowCode,
  setDisplayMode,
  setShowSearchBar,
  setSearchQuery,
  setSearchMatches,
  setCurrentMatchIndex,
  scrollContainerRef,
}: ChatHeaderProps) {
  return (
    <>
      {/* Header - Always visible - Compact in split-screen mode */}
      <nav
        className="header"
        style={{
          height: layoutMode === 'split-screen' ? '48px' : '56px',
          minHeight: layoutMode === 'split-screen' ? '48px' : '56px',
          backgroundColor: '#141618',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50,
        }}
      >
        <div className="header-content">
          <div className="header-inner" style={{ padding: layoutMode === 'split-screen' ? '0 0.75rem' : undefined }}>
            {/* Left side */}
            <div className="header-left">
              {/* Mobile: Always show hamburger menu */}
              {isMobile && (
                <button
                  className="header-btn"
                  aria-label="Open Sidebar"
                  onClick={() => setIsSidebarOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Menu />
                </button>
              )}

              {/* Desktop: Show controls when sidebar is closed */}
              {!isSidebarOpen && !isMobile && (
                <>
                  {/* Sidebar toggle */}
                  <button className="header-btn" aria-label="Toggle Sidebar" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <Menu />
                  </button>

                  {/* New chat */}
                  <button className="header-btn" aria-label="New Chat" onClick={handleNewChat}>
                    <Edit3 />
                  </button>

                  {/* New chat in new tab */}
                  <button
                    className="header-btn"
                    aria-label="New Chat in New Tab"
                    onClick={() => window.open(window.location.origin, '_blank')}
                    title="Open new chat in new tab"
                  >
                    <ExternalLink size={18} />
                  </button>

                  {/* Separator */}
                  <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

                  {/* Previous chat */}
                  <button
                    className="header-btn"
                    aria-label="Previous Chat"
                    onClick={handlePrevChat}
                    disabled={sessions.length === 0 || sessions.findIndex(s => s.id === currentSessionId) <= 0}
                    title="Previous chat"
                    style={{ opacity: sessions.length === 0 || sessions.findIndex(s => s.id === currentSessionId) <= 0 ? 0.3 : 1 }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {/* Next chat */}
                  <button
                    className="header-btn"
                    aria-label="Next Chat"
                    onClick={handleNextChat}
                    disabled={sessions.length === 0 || sessions.findIndex(s => s.id === currentSessionId) >= sessions.length - 1}
                    title="Next chat"
                    style={{ opacity: sessions.length === 0 || sessions.findIndex(s => s.id === currentSessionId) >= sessions.length - 1 ? 0.3 : 1 }}
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Back to recent */}
                  <button
                    className="header-btn"
                    aria-label="Back to Recent"
                    onClick={handleBackToRecent}
                    disabled={navigationHistory.length === 0}
                    title="Back to recent chat"
                    style={{ opacity: navigationHistory.length === 0 ? 0.3 : 1 }}
                  >
                    <History size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Center - Logo and Model Selector - Compact in split-screen */}
            <div className="header-center">
              <div className="flex flex-col items-start w-full">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2" style={{ gap: layoutMode === 'split-screen' ? '0.5rem' : '0.75rem' }}>
                    {!isSidebarOpen && layoutMode !== 'split-screen' && (
                      <img
                        src="/client/agent-boy.svg"
                        alt="Agent Girl"
                        className="header-icon"
                        loading="eager"
                        onError={(e) => {
                          console.error('Failed to load agent-boy.svg');
                          setTimeout(() => {
                            e.currentTarget.src = '/client/agent-boy.svg?' + Date.now();
                          }, 100);
                        }}
                      />
                    )}
                    <div
                      className="header-title text-gradient"
                      style={{
                        fontSize: layoutMode === 'split-screen' ? '0.875rem' : undefined,
                      }}
                    >
                      {layoutMode === 'split-screen' ? 'Chat' : 'Agent Girl'}
                    </div>
                    {/* Model Selector - now allows mid-chat switching with context handoff */}
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={onModelChange}
                      hasMessages={messages.length > 0}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="header-right">
              {/* View toggles - Code & Display Mode */}
              <div className="flex items-center gap-1">
                {/* Code visibility toggle */}
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
                  aria-label={showCode ? 'Hide code blocks' : 'Show code blocks'}
                  title={showCode ? 'Hide code blocks' : 'Show code blocks'}
                  style={{
                    backgroundColor: showCode ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: showCode ? '#3b82f6' : 'rgb(var(--text-secondary))',
                  }}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="text-xs">{showCode ? 'Code' : 'Code'}</span>
                </button>

                {/* Display mode toggle */}
                <button
                  onClick={() => setDisplayMode(displayMode === 'full' ? 'compact' : 'full')}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
                  aria-label={displayMode === 'full' ? 'Compact mode' : 'Full mode'}
                  title={displayMode === 'full' ? 'Hide verbose output' : 'Show all output'}
                  style={{
                    backgroundColor: displayMode === 'full' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: displayMode === 'full' ? '#8b5cf6' : 'rgb(var(--text-secondary))',
                  }}
                >
                  {displayMode === 'full' ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                  <span className="text-xs">{displayMode === 'full' ? 'Full' : 'Compact'}</span>
                </button>
              </div>

              {/* Separator */}
              {onLayoutModeChange && (
                <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
              )}

              {/* Layout Mode Toggle - Click anywhere to toggle */}
              {onLayoutModeChange && (
                <button
                  onClick={() => {
                    const newMode = layoutMode === 'chat-only' ? 'split-screen' : 'chat-only';
                    onLayoutModeChange(newMode);
                    if (newMode === 'split-screen' && !previewUrl && onDetectPreviewUrl) {
                      onDetectPreviewUrl();
                    }
                  }}
                  className="flex items-center rounded-lg p-0.5 transition-all hover:bg-white/5"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  title={layoutMode === 'chat-only' ? 'Switch to Splitview' : 'Switch to Chat only'}
                >
                  {/* Chat option */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all"
                    style={{
                      backgroundColor: layoutMode === 'chat-only' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: layoutMode === 'chat-only' ? '#3b82f6' : 'rgb(var(--text-secondary))',
                      boxShadow: layoutMode === 'chat-only' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </div>
                  {/* Splitview option */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all"
                    style={{
                      backgroundColor: layoutMode === 'split-screen' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: layoutMode === 'split-screen' ? '#3b82f6' : 'rgb(var(--text-secondary))',
                      boxShadow: layoutMode === 'split-screen' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Splitview</span>
                  </div>
                </button>
              )}

              {/* Radio Player - hidden in split-screen mode */}
              {layoutMode !== 'split-screen' && <RadioPlayer />}
              {/* Working Directory Display - compact in split-screen mode */}
              {currentSessionId && sessions.find(s => s.id === currentSessionId)?.working_directory && layoutMode !== 'split-screen' && (
                <WorkingDirectoryDisplay
                  directory={sessions.find(s => s.id === currentSessionId)?.working_directory || ''}
                  sessionId={currentSessionId}
                  onChangeDirectory={handleChangeDirectory}
                />
              )}

              {/* About Button - hidden in split-screen mode */}
              {layoutMode !== 'split-screen' && <AboutButton />}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      {showSearchBar && (
        <div
          style={{
            position: 'sticky',
            top: '60px',
            zIndex: 100,
            padding: '0.5rem 1rem',
            background: 'rgb(var(--bg-secondary))',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgb(var(--text-secondary))',
              }}
            />
            <input
              type="text"
              placeholder="Search in chat..."
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQuery(query);
                if (query.length >= 2) {
                  // Find matching message indices
                  const matches: number[] = [];
                  messages.forEach((msg, idx) => {
                    const content = typeof msg.content === 'string'
                      ? msg.content
                      : JSON.stringify(msg.content);
                    if (content.toLowerCase().includes(query.toLowerCase())) {
                      matches.push(idx);
                    }
                  });
                  setSearchMatches(matches);
                  setCurrentMatchIndex(0);
                  if (matches.length > 0 && scrollContainerRef.current) {
                    const messageElements = scrollContainerRef.current.querySelectorAll('[data-message-index]');
                    const targetElement = Array.from(messageElements).find(
                      el => el.getAttribute('data-message-index') === String(matches[0])
                    );
                    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                } else {
                  setSearchMatches([]);
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                background: 'rgb(var(--bg-input))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: 'rgb(var(--text-primary))',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
          {searchMatches.length > 0 && (
            <>
              <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {currentMatchIndex + 1} / {searchMatches.length}
              </span>
              <button
                onClick={() => {
                  const newIdx = currentMatchIndex > 0 ? currentMatchIndex - 1 : searchMatches.length - 1;
                  setCurrentMatchIndex(newIdx);
                  if (scrollContainerRef.current) {
                    const messageElements = scrollContainerRef.current.querySelectorAll('[data-message-index]');
                    const targetElement = Array.from(messageElements).find(
                      el => el.getAttribute('data-message-index') === String(searchMatches[newIdx])
                    );
                    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                style={{
                  padding: '0.25rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  color: 'rgb(var(--text-secondary))',
                }}
                title="Previous match"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => {
                  const newIdx = currentMatchIndex < searchMatches.length - 1 ? currentMatchIndex + 1 : 0;
                  setCurrentMatchIndex(newIdx);
                  if (scrollContainerRef.current) {
                    const messageElements = scrollContainerRef.current.querySelectorAll('[data-message-index]');
                    const targetElement = Array.from(messageElements).find(
                      el => el.getAttribute('data-message-index') === String(searchMatches[newIdx])
                    );
                    targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                style={{
                  padding: '0.25rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  display: 'flex',
                  color: 'rgb(var(--text-secondary))',
                }}
                title="Next match"
              >
                <ChevronDown size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => {
              setShowSearchBar(false);
              setSearchQuery('');
              setSearchMatches([]);
            }}
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgb(var(--text-secondary))',
              display: 'flex',
            }}
            title="Close search (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
