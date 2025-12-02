import { create } from 'zustand';
import type { QueuedMessage } from '../../types/queue';

interface MessageQueueStoreState {
  queuedMessages: QueuedMessage[];
}

interface MessageQueueStoreActions {
  addMessage: (content: string) => QueuedMessage;
  removeMessage: (messageId: string) => void;
  clearQueue: () => void;
  getNextMessage: () => QueuedMessage | undefined;
  popNextMessage: () => QueuedMessage | undefined;
  getQueueLength: () => number;
}

type MessageQueueStore = MessageQueueStoreState & MessageQueueStoreActions;

export const useMessageQueueStore = create<MessageQueueStore>((set, get) => ({
  // State
  queuedMessages: [],

  // Actions
  addMessage: (content) => {
    const queuedMessage: QueuedMessage = {
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      content,
      timestamp: Date.now()
    };

    set((state) => ({
      queuedMessages: [...state.queuedMessages, queuedMessage]
    }));

    return queuedMessage;
  },

  removeMessage: (messageId) => set((state) => ({
    queuedMessages: state.queuedMessages.filter((msg) => msg.id !== messageId)
  })),

  clearQueue: () => set({ queuedMessages: [] }),

  getNextMessage: () => {
    const { queuedMessages } = get();
    return queuedMessages.length > 0 ? queuedMessages[0] : undefined;
  },

  popNextMessage: () => {
    const { queuedMessages } = get();
    if (queuedMessages.length === 0) {
      return undefined;
    }

    const nextMessage = queuedMessages[0];
    set((state) => ({
      queuedMessages: state.queuedMessages.slice(1)
    }));

    return nextMessage;
  },

  getQueueLength: () => get().queuedMessages.length,
}));

// 选择器 helpers
export const selectQueuedMessages = (state: MessageQueueStore) => state.queuedMessages;
export const selectHasQueuedMessages = (state: MessageQueueStore) => state.queuedMessages.length > 0;
export const selectQueueLength = (state: MessageQueueStore) => state.queuedMessages.length;
