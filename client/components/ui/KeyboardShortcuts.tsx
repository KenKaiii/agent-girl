/**
 * Agent Girl - Keyboard Shortcuts Reference
 * Quick reference for common keyboard shortcuts
 */

import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Chat Navigation',
      items: [
        { keys: ['⌘', 'K'], description: 'New Chat' },
        { keys: ['⌘', 'T'], description: 'New Chat Tab' },
        { keys: ['⌘', '['], description: 'Previous Chat' },
        { keys: ['⌘', ']'], description: 'Next Chat' },
        { keys: ['⌘', 'H'], description: 'Back to Recent' },
      ],
    },
    {
      category: 'Display & View',
      items: [
        { keys: ['⌘', 'B'], description: 'Toggle Sidebar' },
        { keys: ['⌘', 'F'], description: 'Search in Chat' },
        { keys: ['⌘', 'E'], description: 'Toggle Code Visibility' },
        { keys: ['⌘', 'Shift', 'M'], description: 'Toggle Compact/Full View' },
        { keys: ['⌘', '/'], description: 'Show Keyboard Shortcuts' },
      ],
    },
    {
      category: 'Message Actions',
      items: [
        { keys: ['⌘', 'Enter'], description: 'Send Message' },
        { keys: ['Shift', 'Enter'], description: 'New Line in Message' },
        { keys: ['Esc'], description: 'Clear Message Draft (when empty)' },
      ],
    },
    {
      category: 'File Operations',
      items: [
        { keys: ['⌘', 'O'], description: 'Open File/Folder' },
        { keys: ['⌘', 'Shift', 'O'], description: 'Open Chat Folder' },
      ],
    },
    {
      category: 'Dialogs',
      items: [
        { keys: ['Esc'], description: 'Close Modal/Dialog' },
        { keys: ['Enter'], description: 'Confirm Action (when ready)' },
      ],
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          background: 'rgb(var(--bg-input))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '48rem',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Command size={24} style={{ color: 'rgb(var(--blue-accent))' }} />
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'rgb(var(--text-primary))',
                margin: 0,
              }}
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Close"
          >
            <X size={20} style={{ color: 'rgb(var(--text-secondary))' }} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'rgb(var(--blue-accent))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 0.75rem 0',
                }}
              >
                {section.category}
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                }}
              >
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.25rem',
                      }}
                    >
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'rgb(var(--text-secondary))',
                                margin: '0 0.125rem',
                              }}
                            >
                              +
                            </span>
                          )}
                          <kbd
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              fontWeight: 500,
                              color: 'rgb(var(--text-primary))',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: 'rgb(var(--text-secondary))',
                        marginLeft: 'auto',
                      }}
                    >
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer Note */}
          <div
            style={{
              fontSize: '0.75rem',
              color: 'rgb(var(--text-secondary))',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.375rem',
              marginTop: '1rem',
            }}
          >
            💡 <strong>Pro Tip:</strong> Press <kbd style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>⌘ /</kbd> anytime to show this help dialog
          </div>
        </div>
      </div>
    </div>
  );
}
