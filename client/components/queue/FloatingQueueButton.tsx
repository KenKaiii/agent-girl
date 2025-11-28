/**
 * FloatingQueueButton - Minimalist floating action button for quick queue access
 * Single button that opens a compact queue panel
 */

import React, { useState } from 'react';
import { SimpleQueueUI } from './SimpleQueueUI';

interface FloatingQueueButtonProps {
  sessionId: string;
}

export function FloatingQueueButton({ sessionId }: FloatingQueueButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 z-40"
        title="Queue Management"
      >
        {isOpen ? '✕' : '📋'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-40 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900">Quick Queue</h3>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <SimpleQueueUI sessionId={sessionId} />
          </div>
        </div>
      )}

      {/* Background overlay - click to close */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30"
        />
      )}
    </>
  );
}
