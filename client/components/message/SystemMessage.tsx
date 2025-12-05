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

import React, { useState, memo } from 'react';
import { SystemMessage as SystemMessageType, PreviewActionMetadata } from './types';
import { PreviewActionMessage, PreviewActionData } from './PreviewActionMessage';

interface SystemMessageProps {
  message: SystemMessageType;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export const SystemMessage = memo(function SystemMessage({ message }: SystemMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isInitMessage = message.metadata?.type === 'system' && (message.metadata as { subtype?: string })?.subtype === 'init';

  // Check if this is a preview action message
  const isPreviewAction = message.metadata?.type === 'preview';

  if (isPreviewAction) {
    const previewMeta = message.metadata as PreviewActionMetadata;
    const previewData: PreviewActionData = {
      type: 'preview_action',
      action: previewMeta.action,
      previewUrl: previewMeta.previewUrl,
      elements: previewMeta.elements,
      fileContext: previewMeta.fileContext,
      viewport: previewMeta.viewport,
      screenshot: previewMeta.screenshot,
      timestamp: message.timestamp,
    };
    return <PreviewActionMessage data={previewData} />;
  }

  return (
    <div className="mb-4 p-4 bg-gray-50 border-l-4 border-gray-400 rounded-r-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
          <span className="text-sm font-medium text-gray-700">System</span>
          {isInitMessage && (
            <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
              Initialization
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
      
      <div className="text-gray-700 text-sm mb-2">
        {message.content}
      </div>
      
      {message.metadata && (
        <div className="mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          >
            {isExpanded ? '▼' : '▶'} View Metadata
          </button>
          
          {isExpanded && (
            <div className="mt-2 p-3 bg-white rounded border text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(message.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});