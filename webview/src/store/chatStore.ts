import { create } from 'zustand';
import type { ChatMessage, ChatState } from '../../types/messages';

interface ChatStoreState {
  messages: ChatMessage[];
  currentRequest: ChatState['currentRequest'];
  streamingMessages: Map<string, number>;
}

interface ChatStoreActions {
  addMessage: (message: ChatMessage) => void;
  addMessages: (messages: ChatMessage[]) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setCurrentRequest: (request: ChatState['currentRequest']) => void;
  setStreamingMessage: (sessionId: string, index: number) => void;
  removeStreamingMessage: (sessionId: string) => void;
  clearStreamingMessages: () => void;
  getStreamingMessageIndex: (sessionId: string) => number | undefined;
}

type ChatStore = ChatStoreState & ChatStoreActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // State
  messages: [],
  currentRequest: null,
  streamingMessages: new Map(),

  // Actions
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  addMessages: (messages) => set((state) => ({
    messages: [...state.messages, ...messages]
  })),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),

  setMessages: (messages) => set({ messages }),

  clearMessages: () => set({ messages: [] }),

  setCurrentRequest: (request) => set({ currentRequest: request }),

  setStreamingMessage: (sessionId, index) => set((state) => {
    const newMap = new Map(state.streamingMessages);
    newMap.set(sessionId, index);
    return { streamingMessages: newMap };
  }),

  removeStreamingMessage: (sessionId) => set((state) => {
    const newMap = new Map(state.streamingMessages);
    newMap.delete(sessionId);
    return { streamingMessages: newMap };
  }),

  clearStreamingMessages: () => set({ streamingMessages: new Map() }),

  getStreamingMessageIndex: (sessionId) => get().streamingMessages.get(sessionId),
}));

// 选择器 helpers
export const selectMessages = (state: ChatStore) => state.messages;
export const selectCurrentRequest = (state: ChatStore) => state.currentRequest;
export const selectIsLoading = (state: ChatStore) => state.currentRequest !== null;
