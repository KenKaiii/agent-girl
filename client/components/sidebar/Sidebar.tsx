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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Edit3, Search, Trash2, Edit, FolderOpen, Copy, Code2, Download, Upload, MessageSquare } from 'lucide-react';
import { toast } from '../../utils/toast';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

// Message search result type
interface MessageSearchResult {
  id: string;
  session_id: string;
  session_title: string;
  type: string;
  content: string;
  timestamp: string;
  match_preview: string;
}

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  createdAt?: Date;
  isActive?: boolean;
  isLoading?: boolean;
  workingDirectory?: string;
}

// Format relative time for display
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format as date for older
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats?: Chat[];
  onNewChat?: () => void;
  onChatSelect?: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
  onChatRename?: (chatId: string, newTitle: string) => void;
  showCompact?: boolean;
  onToggleCompact?: () => void;
  showCode?: boolean;
  onToggleCode?: () => void;
  onNewChatTab?: () => void;
  onPreviousChat?: () => void;
  onNextChat?: () => void;
  onBackToRecent?: () => void;
  canPreviousChat?: boolean;
  canNextChat?: boolean;
  canBackToRecent?: boolean;
}

export function Sidebar({
  isOpen,
  onToggle,
  chats = [],
  onNewChat,
  onChatSelect,
  onChatDelete,
  onChatRename,
  showCompact = false,
  onToggleCompact,
  showCode = true,
  onToggleCode,
  onNewChatTab,
  onPreviousChat,
  onNextChat,
  onBackToRecent,
  canPreviousChat = false,
  canNextChat = false,
  canBackToRecent = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAllChatsExpanded, setIsAllChatsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; chatId: string; chatName: string }>({
    isOpen: false,
    chatId: '',
    chatName: '',
  });
  const [messageSearchResults, setMessageSearchResults] = useState<MessageSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced message search
  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setMessageSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/sessions/search?q=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setMessageSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('Message search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchMessages(searchQuery);
      }, 300);
    } else {
      setMessageSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchMessages]);

  // Group chats by date with precise grouping
  const groupChatsByDate = (chats: Chat[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Create ordered groups
    const orderedGroups: { label: string; chats: Chat[] }[] = [];
    const groupMap: { [key: string]: Chat[] } = {};

    // Weekday names
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    chats.forEach(chat => {
      const chatDate = new Date(chat.timestamp);
      const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

      const diffTime = today.getTime() - chatDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let groupKey: string;

      if (diffDays === 0) {
        groupKey = 'Today';
      } else if (diffDays === 1) {
        groupKey = 'Yesterday';
      } else if (diffDays < 7) {
        // Show weekday name for last 7 days
        groupKey = weekdays[chatDay.getDay()];
      } else if (diffDays < 14) {
        groupKey = 'Last Week';
      } else if (diffDays < 30) {
        groupKey = 'This Month';
      } else if (chatDate.getFullYear() === now.getFullYear()) {
        // Show month name for this year
        groupKey = months[chatDate.getMonth()];
      } else {
        // Show month + year for older
        groupKey = `${months[chatDate.getMonth()]} ${chatDate.getFullYear()}`;
      }

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = [];
      }
      groupMap[groupKey].push(chat);
    });

    // Define group order
    const groupOrder = [
      'Today', 'Yesterday',
      ...weekdays, // Sunday through Saturday
      'Last Week', 'This Month',
      ...months, // Jan through Dec
    ];

    // Add groups in order
    groupOrder.forEach(key => {
      if (groupMap[key] && groupMap[key].length > 0) {
        orderedGroups.push({ label: key, chats: groupMap[key] });
        delete groupMap[key];
      }
    });

    // Add remaining groups (older with year) sorted by date
    const remainingKeys = Object.keys(groupMap).sort((a, b) => {
      // Sort by most recent first
      const aDate = groupMap[a][0]?.timestamp || new Date(0);
      const bDate = groupMap[b][0]?.timestamp || new Date(0);
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    remainingKeys.forEach(key => {
      if (groupMap[key].length > 0) {
        orderedGroups.push({ label: key, chats: groupMap[key] });
      }
    });

    return orderedGroups;
  };

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = groupChatsByDate(filteredChats);

  // Type for the grouped chats
  type ChatGroup = { label: string; chats: Chat[] };

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleRenameClick = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleRenameSubmit = (chatId: string) => {
    const currentChat = chats.find(c => c.id === chatId);
    const newName = editingTitle.trim();

    // Validate folder name: max 42 chars, lowercase + dashes + numbers only
    if (!newName) {
      setEditingId(null);
      setEditingTitle('');
      return;
    }

    if (newName.length > 42) {
      toast.error('Invalid folder name', {
        description: 'Folder name must be 42 characters or less'
      });
      return;
    }

    if (!/^[a-z0-9-]+$/.test(newName)) {
      toast.error('Invalid folder name', {
        description: 'Only lowercase letters, numbers, and dashes allowed'
      });
      return;
    }

    if (newName !== currentChat?.title) {
      onChatRename?.(chatId, newName);
    }

    setEditingId(null);
    setEditingTitle('');
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleDeleteClick = (chatId: string, chatName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === chatId);
    setDeleteConfirmation({
      isOpen: true,
      chatId,
      chatName: chat?.title || chatName || 'Untitled Chat',
    });
  };

  const handleConfirmDelete = () => {
    onChatDelete?.(deleteConfirmation.chatId);
    setDeleteConfirmation({ isOpen: false, chatId: '', chatName: '' });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, chatId: '', chatName: '' });
  };

  const handleOpenChatFolder = async () => {
    try {
      const response = await fetch('/api/open-chat-folder', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Opened chat folder', {
          description: data.path
        });
      } else {
        toast.error('Failed to open chat folder', {
          description: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      toast.error('Failed to open chat folder', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-container">
        {/* Header */}
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem' }}>
          <div className="sidebar-logo">
            <img src="/client/agent-boy.svg" alt="Agent Girl" className="sidebar-logo-icon" />
          </div>

          {/* Header controls when sidebar is open */}
          {isOpen && (
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {/* Navigation buttons */}
              <button
                className="header-btn"
                aria-label="New Chat"
                title="New chat"
                onClick={onNewChat}
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                <Edit3 size={18} opacity={0.8} />
              </button>

              <button
                className="header-btn"
                aria-label="New Chat in New Tab"
                title="Open new chat in new tab"
                onClick={onNewChatTab}
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                </svg>
              </button>

              {/* Divider */}
              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0px 4px' }} />

              {/* Chat navigation */}
              <button
                className="header-btn"
                aria-label="Previous Chat"
                title="Previous chat"
                onClick={onPreviousChat}
                disabled={!canPreviousChat}
                style={{ padding: '0.5rem', cursor: 'pointer', opacity: canPreviousChat ? 1 : 0.3 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <button
                className="header-btn"
                aria-label="Next Chat"
                title="Next chat"
                onClick={onNextChat}
                style={{ padding: '0.5rem', cursor: 'pointer', opacity: canNextChat ? 1 : 0.3 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              <button
                className="header-btn"
                aria-label="Back to Recent"
                title="Back to recent chat"
                onClick={onBackToRecent}
                disabled={!canBackToRecent}
                style={{ padding: '0.5rem', cursor: 'pointer', opacity: canBackToRecent ? 1 : 0.3 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M12 7v5l4 2" />
                </svg>
              </button>

              {/* Divider */}
              <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0px 4px' }} />

              {/* Control buttons */}
              <button
                className="header-btn"
                aria-label={showCompact ? 'Show verbose output' : 'Hide verbose output'}
                title={showCompact ? 'Show verbose output (thinking, WebSearch, tools)' : 'Hide verbose output (thinking, WebSearch, tools)'}
                onClick={onToggleCompact}
                style={{ padding: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>

              <button
                className="header-btn"
                aria-label={showCode ? 'Hide code blocks' : 'Show code blocks'}
                title={showCode ? 'Hide all code blocks' : 'Show all code blocks'}
                onClick={onToggleCode}
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                {showCode ? (
                  <Code2 size={16} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m17.25 6.75-10.5 10.5M6.75 6.75l10.5 10.5" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Toggle button always visible */}
          <button className="sidebar-toggle-btn" onClick={onToggle} aria-label="Toggle Sidebar" style={{ padding: '0.5rem' }}>
            <Menu size={24} opacity={0.8} className={isOpen ? '' : 'rotate-180'} />
          </button>
        </div>

        {/* New Chat Button */}
        <button className="sidebar-new-chat-btn" onClick={onNewChat}>
          <Edit3 size={20} opacity={0.8} />
          <span>New Chat</span>
        </button>

        {/* New Chat Tab Button - Opens in new browser tab */}
        <button
          className="sidebar-new-chat-btn"
          onClick={() => {
            // Open a new browser tab with fresh chat (no hash = new chat)
            window.open(window.location.origin, '_blank');
          }}
          style={{ marginTop: '0.5rem' }}
        >
          <Edit3 size={20} opacity={0.8} />
          <span>+ New Chat Tab</span>
        </button>

        {/* Open Chat Folder Button */}
        <button className="sidebar-new-chat-btn" onClick={handleOpenChatFolder} style={{ marginTop: '0.5rem' }}>
          <FolderOpen size={20} opacity={0.8} />
          <span>Open Chat Folder</span>
        </button>

        {/* Import Chat Button */}
        <button
          className="sidebar-new-chat-btn"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text);
                const response = await fetch('/api/sessions/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                if (response.ok) {
                  const result = await response.json();
                  toast.success('Chat imported', { description: `${result.importedMessages} messages` });
                  // Refresh the page to show new session
                  window.location.reload();
                } else {
                  const error = await response.json();
                  toast.error('Import failed', { description: error.error });
                }
              } catch (err) {
                toast.error('Import failed', { description: 'Invalid JSON file' });
              }
            };
            input.click();
          }}
          style={{ marginTop: '0.5rem' }}
        >
          <Upload size={20} opacity={0.8} />
          <span>Import Chat</span>
        </button>

        {/* Search */}
        <div className="sidebar-search-container">
          <div className="sidebar-search">
            <div className="sidebar-search-icon">
              <Search size={16} />
            </div>
            <input
              className="sidebar-search-input"
              placeholder="Search chats & messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'rgba(255,255,255,0.6)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* Message Search Results */}
        {searchQuery.length >= 2 && messageSearchResults.length > 0 && (
          <div style={{
            padding: '0 0.75rem',
            marginBottom: '0.5rem',
          }}>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgb(var(--text-secondary))',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              <MessageSquare size={12} />
              <span>Messages ({messageSearchResults.length})</span>
            </div>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}>
              {messageSearchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onChatSelect?.(result.session_id);
                    setSearchQuery('');
                    setMessageSearchResults([]);
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'rgb(var(--text-primary))',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'rgb(var(--text-secondary))',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: result.type === 'user' ? 'rgb(59, 130, 246)' : 'rgb(16, 185, 129)',
                    }} />
                    <span>{result.session_title}</span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {result.match_preview}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="sidebar-chat-list">
          {/* All Chats Dropdown */}
          <div className="sidebar-section-header">
            <button
              className="sidebar-section-toggle"
              onClick={() => setIsAllChatsExpanded(!isAllChatsExpanded)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="sidebar-chevron"
                style={{ transform: isAllChatsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
              <span>All Chats</span>
            </button>
          </div>

          {/* Chat Groups */}
          {isAllChatsExpanded && (
            <div className="sidebar-chat-groups">
              {(groupedChats as ChatGroup[]).map((group) => {
                if (group.chats.length === 0) return null;

                return (
                  <div key={group.label} className="sidebar-chat-group">
                    <div className="sidebar-group-label">{group.label}</div>
                    {group.chats.map((chat) => (
                      <div key={chat.id} className="sidebar-chat-item-wrapper group" style={{ position: 'relative' }}>
                        {editingId === chat.id ? (
                          <div style={{ padding: '0.5rem' }}>
                            <input
                              ref={inputRef}
                              type="text"
                              value={editingTitle}
                              maxLength={42}
                              onChange={(e) => {
                                // Convert to lowercase and filter out invalid chars
                                const filtered = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                setEditingTitle(filtered);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameSubmit(chat.id);
                                } else if (e.key === 'Escape') {
                                  handleRenameCancel();
                                }
                              }}
                              onBlur={() => handleRenameSubmit(chat.id)}
                              placeholder="folder-name"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '0.375rem',
                                color: 'rgb(var(--text-primary))',
                                fontSize: '0.875rem',
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <button
                              className={`sidebar-chat-item ${chat.isActive ? 'sidebar-chat-item-active' : ''}`}
                              onClick={() => onChatSelect?.(chat.id)}
                              title={chat.workingDirectory || chat.title}
                            >
                              <div className="sidebar-chat-title">
                                {chat.title}
                                {chat.isLoading && (
                                  <span style={{
                                    marginLeft: '0.5rem',
                                    display: 'inline-flex',
                                    gap: '2px',
                                    alignItems: 'center',
                                  }}>
                                    <span style={{
                                      width: '3px',
                                      height: '3px',
                                      backgroundColor: 'rgb(var(--text-secondary))',
                                      borderRadius: '50%',
                                      animation: 'pulse 1.4s ease-in-out infinite',
                                      animationDelay: '0s',
                                      opacity: 0.6,
                                    }}></span>
                                    <span style={{
                                      width: '3px',
                                      height: '3px',
                                      backgroundColor: 'rgb(var(--text-secondary))',
                                      borderRadius: '50%',
                                      animation: 'pulse 1.4s ease-in-out infinite',
                                      animationDelay: '0.2s',
                                      opacity: 0.6,
                                    }}></span>
                                    <span style={{
                                      width: '3px',
                                      height: '3px',
                                      backgroundColor: 'rgb(var(--text-secondary))',
                                      borderRadius: '50%',
                                      animation: 'pulse 1.4s ease-in-out infinite',
                                      animationDelay: '0.4s',
                                      opacity: 0.6,
                                    }}></span>
                                  </span>
                                )}
                              </div>
                              <div style={{
                                fontSize: '0.65rem',
                                color: 'rgb(var(--text-secondary))',
                                opacity: 0.7,
                                marginTop: '2px',
                              }}>
                                {formatRelativeTime(new Date(chat.timestamp))}
                              </div>
                            </button>
                            <div className={`sidebar-chat-menu ${chat.isActive ? '' : 'sidebar-chat-menu-hidden'}`} style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              <button
                                className="sidebar-chat-menu-btn"
                                aria-label="Rename Chat"
                                title="Rename"
                                onClick={(e) => handleRenameClick(chat, e)}
                                style={{
                                  padding: '0.25rem',
                                  background: chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'rgb(var(--text-secondary))',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                  e.currentTarget.style.color = 'rgb(var(--text-primary))';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))';
                                  e.currentTarget.style.color = 'rgb(var(--text-secondary))';
                                }}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="sidebar-chat-menu-btn"
                                aria-label="Open Folder"
                                title="Open folder"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (chat.workingDirectory) {
                                    try {
                                      const response = await fetch('/api/open-folder', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ path: chat.workingDirectory }),
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
                                  }
                                }}
                                style={{
                                  padding: '0.25rem',
                                  background: chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'rgb(var(--text-secondary))',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                  e.currentTarget.style.color = 'rgb(var(--text-primary))';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))';
                                  e.currentTarget.style.color = 'rgb(var(--text-secondary))';
                                }}
                              >
                                <FolderOpen size={14} />
                              </button>
                              <button
                                className="sidebar-chat-menu-btn"
                                aria-label="Copy Path"
                                title="Copy path"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (chat.workingDirectory) {
                                    try {
                                      await navigator.clipboard.writeText(chat.workingDirectory);
                                      toast.success('Path copied', { description: chat.workingDirectory });
                                    } catch {
                                      toast.error('Failed to copy path');
                                    }
                                  }
                                }}
                                style={{
                                  padding: '0.25rem',
                                  background: chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'rgb(var(--text-secondary))',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                  e.currentTarget.style.color = 'rgb(var(--text-primary))';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))';
                                  e.currentTarget.style.color = 'rgb(var(--text-secondary))';
                                }}
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                className="sidebar-chat-menu-btn"
                                aria-label="Export Chat"
                                title="Export as JSON"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await fetch(`/api/sessions/${chat.id}/export`);
                                    if (response.ok) {
                                      const data = await response.json();
                                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `${chat.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                      toast.success('Chat exported', { description: `${data.messages?.length || 0} messages` });
                                    } else {
                                      toast.error('Export failed');
                                    }
                                  } catch {
                                    toast.error('Export failed');
                                  }
                                }}
                                style={{
                                  padding: '0.25rem',
                                  background: chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'rgb(var(--text-secondary))',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
                                  e.currentTarget.style.color = '#22c55e';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))';
                                  e.currentTarget.style.color = 'rgb(var(--text-secondary))';
                                }}
                              >
                                <Download size={14} />
                              </button>
                              <button
                                className="sidebar-chat-menu-btn"
                                aria-label="Delete Chat"
                                title="Delete"
                                onClick={(e) => handleDeleteClick(chat.id, chat.title, e)}
                                style={{
                                  padding: '0.25rem',
                                  background: chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'rgb(var(--text-secondary))',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = chat.isActive ? 'rgb(var(--bg-tertiary))' : 'rgb(var(--bg-secondary))';
                                  e.currentTarget.style.color = 'rgb(var(--text-secondary))';
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        chatName={deleteConfirmation.chatName}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
