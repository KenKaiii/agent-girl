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
import { Message } from './types';
import { UserMessage } from './UserMessage';
import { SystemMessage } from './SystemMessage';
import { AssistantMessage } from './AssistantMessage';

interface MessageRendererProps {
  message: Message;
  onRemoveMessage?: (messageId: string) => void;
}

export function MessageRenderer({ message, onRemoveMessage }: MessageRendererProps) {
  switch (message.type) {
    case 'user':
      return <UserMessage message={message} />;

    case 'system':
      return <SystemMessage message={message} />;

    case 'assistant':
      return <AssistantMessage message={message} onRemove={onRemoveMessage} />;

    default: {
      const unknownMessage = message as { type: string };
      return (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="text-red-700">
            Unknown message type: {unknownMessage.type}
          </div>
          <pre className="text-sm mt-2 text-gray-600">
            {JSON.stringify(message, null, 2)}
          </pre>
        </div>
      );
    }
  }
}

export * from './types';
export { UserMessage } from './UserMessage';
export { SystemMessage } from './SystemMessage';
export { AssistantMessage } from './AssistantMessage';