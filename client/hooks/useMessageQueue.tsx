/**
 * useMessageQueue Hook - Manages a standalone message queue
 *
 * This hook provides queue management WITHOUT integrating into ChatContainer's
 * message flow. Queue processing is handled separately via API calls.
 */

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface QueueConfig {
  delayMs: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface QueueItem {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  retries?: number;
  createdAt: number;
  completedAt?: number;
}

interface QueueState {
  items: QueueItem[];
  isProcessing: boolean;
  isPaused: boolean;
  config: QueueConfig;
}

interface MessageQueueContextType {
  queue: QueueState;
  addToQueue: (prompt: string) => void;
  addMultipleToQueue: (prompts: string[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  startProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  stopProcessing: () => void;
  getNextItem: () => QueueItem | null;
  markItemProcessing: (id: string) => void;
  markItemComplete: (id: string) => void;
  markItemFailed: (id: string, error: string) => void;
  updateConfig: (config: Partial<QueueConfig>) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
}

const MessageQueueContext = createContext<MessageQueueContextType | null>(null);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const DEFAULT_CONFIG: QueueConfig = {
  delayMs: 3000,
  maxRetries: 2,
  timeoutMs: 300000,
};

export function MessageQueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueState>(() => {
    try {
      const saved = localStorage.getItem('agent-girl-queue-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          items: parsed.items || [],
          isProcessing: false,
          isPaused: false,
          config: parsed.config || DEFAULT_CONFIG,
        };
      }
    } catch {
      // Ignore parsing errors
    }
    return {
      items: [],
      isProcessing: false,
      isPaused: false,
      config: DEFAULT_CONFIG,
    };
  });

  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Persist queue to localStorage
  useEffect(() => {
    localStorage.setItem('agent-girl-queue-state', JSON.stringify(queue));
  }, [queue]);

  const addToQueue = useCallback((prompt: string) => {
    const item: QueueItem = {
      id: generateId(),
      prompt,
      status: 'pending',
      createdAt: Date.now(),
    };
    setQueue(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));
  }, []);

  const addMultipleToQueue = useCallback((prompts: string[]) => {
    const newItems: QueueItem[] = prompts.map(prompt => ({
      id: generateId(),
      prompt,
      status: 'pending',
      createdAt: Date.now(),
    }));
    setQueue(prev => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }));
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue(prev => ({
      ...prev,
      items: [],
      isProcessing: false,
      isPaused: false,
    }));
  }, []);

  const startProcessing = useCallback(() => {
    setQueue(prev => ({
      ...prev,
      isProcessing: true,
      isPaused: false,
    }));
  }, []);

  const pauseProcessing = useCallback(() => {
    setQueue(prev => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeProcessing = useCallback(() => {
    setQueue(prev => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  const stopProcessing = useCallback(() => {
    setQueue(prev => ({
      ...prev,
      isProcessing: false,
      isPaused: false,
    }));
  }, []);

  const getNextItem = useCallback((): QueueItem | null => {
    const item = queue.items.find(i => i.status === 'pending');
    return item || null;
  }, [queue.items]);

  const markItemProcessing = useCallback((id: string) => {
    setQueue(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, status: 'processing' } : item
      ),
    }));
  }, []);

  const markItemComplete = useCallback((id: string) => {
    setQueue(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, status: 'completed', completedAt: Date.now() } : item
      ),
    }));
  }, []);

  const markItemFailed = useCallback((id: string, error: string) => {
    setQueue(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, status: 'failed', error } : item
      ),
    }));
  }, []);

  const updateConfig = useCallback((config: Partial<QueueConfig>) => {
    setQueue(prev => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  const value: MessageQueueContextType = {
    queue,
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    stopProcessing,
    getNextItem,
    markItemProcessing,
    markItemComplete,
    markItemFailed,
    updateConfig,
    isQueueOpen,
    setIsQueueOpen,
  };

  return (
    <MessageQueueContext.Provider value={value}>
      {children}
    </MessageQueueContext.Provider>
  );
}

export function useMessageQueue(): MessageQueueContextType {
  const context = useContext(MessageQueueContext);
  if (!context) {
    throw new Error('useMessageQueue must be used within MessageQueueProvider');
  }
  return context;
}
