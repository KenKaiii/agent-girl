/**
 * Agent Girl - Delete Confirmation Modal
 * Security confirmation for destructive actions
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  chatName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  chatName,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [confirmationText] = useState('permanently delete');
  const isConfirmed = inputValue.toLowerCase() === confirmationText.toLowerCase();

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      if (e.key === 'Enter' && isConfirmed) {
        e.preventDefault();
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isConfirmed, onConfirm, onCancel]);

  if (!isOpen) return null;

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
        zIndex: 10001,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        style={{
          background: 'rgb(var(--bg-input))',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '28rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
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
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} style={{ color: 'rgb(239, 68, 68)' }} />
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'rgb(239, 68, 68)',
                margin: 0,
              }}
            >
              Delete Chat
            </h2>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              color: 'rgb(var(--text-secondary))',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Warning Message */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.5rem',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'rgb(239, 68, 68)',
                margin: '0 0 0.5rem 0',
              }}
            >
              ⚠️ Security Notice
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'rgb(var(--text-secondary))',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              You are about to <strong>permanently delete</strong> the chat:
            </p>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'rgb(var(--text-primary))',
                margin: '0.5rem 0 0 0',
                fontWeight: 500,
                wordBreak: 'break-word',
              }}
            >
              &ldquo;{chatName}&rdquo;
            </p>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'rgb(239, 68, 68)',
                margin: '0.5rem 0 0 0',
              }}
            >
              This action cannot be undone. All messages and data will be lost.
            </p>
          </div>

          {/* Confirmation Input */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <label
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'rgb(var(--text-primary))',
              }}
            >
              Type to confirm:
            </label>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'rgb(var(--text-secondary))',
                marginBottom: '0.25rem',
              }}
            >
              Enter <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>permanently delete</code> to confirm
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="permanently delete"
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgb(var(--bg-primary))',
                border: `1px solid ${isConfirmed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '0.5rem',
                color: 'rgb(var(--text-primary))',
                fontSize: '0.875rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Keyboard Shortcuts Info */}
          <div
            style={{
              fontSize: '0.75rem',
              color: 'rgb(var(--text-secondary))',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '0.375rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div>⌨️ <strong>Esc</strong> - Cancel</div>
            <div>⌨️ <strong>Enter</strong> - Confirm (when text matches)</div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '0.625rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              color: 'rgb(var(--text-primary))',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed}
            style={{
              padding: '0.625rem 1rem',
              background: isConfirmed ? 'rgb(239, 68, 68)' : 'rgba(239, 68, 68, 0.3)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: isConfirmed ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: isConfirmed ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (isConfirmed) {
                e.currentTarget.style.background = 'rgb(220, 38, 38)';
              }
            }}
            onMouseLeave={(e) => {
              if (isConfirmed) {
                e.currentTarget.style.background = 'rgb(239, 68, 68)';
              }
            }}
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
