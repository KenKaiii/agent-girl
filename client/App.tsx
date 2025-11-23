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

import React, { useEffect, useState } from "react";
import { ChatContainer } from "./components/chat/ChatContainer";
import { QueuePanel } from "./components/queue/QueuePanel";
import { MessageQueueProvider } from "./hooks/useMessageQueue";
import { PreLoader } from "./components/preloader/PreLoader";
import { Toaster } from "sonner";

const App: React.FC = () => {
  const [showPreLoader, setShowPreLoader] = useState(true);

  // Preload the agent icon to prevent broken image on first render
  useEffect(() => {
    const img = new Image();
    img.src = '/client/agent-boy.svg';
  }, []);

  return (
    <MessageQueueProvider>
      <>
        {showPreLoader && <PreLoader onComplete={() => setShowPreLoader(false)} />}
        <ChatContainer />
        <QueuePanel />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'sonner-toast',
            style: {
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </>
    </MessageQueueProvider>
  );
};

export default App;
