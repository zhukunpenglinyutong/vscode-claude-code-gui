import { create } from 'zustand';
import type { SDKMessage } from '@anthropic-ai/claude-code';

export interface Session {
  id: string;
  label: string;
  timestamp: Date;
  messages: SDKMessage[];
}

interface SessionStoreState {
  currentSessionId: string;
  sessions: Session[];
  capabilities: string[];
}

interface SessionStoreActions {
  setCurrentSessionId: (id: string) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  removeSession: (id: string) => void;
  setCapabilities: (capabilities: string[]) => void;
  getSessionById: (id: string) => Session | undefined;
  // 会话操作 - 发送消息到 extension
  requestSessionList: () => void;
  loadSession: (sessionId: string) => void;
  createNewSession: () => void;
}

type SessionStore = SessionStoreState & SessionStoreActions;

// VS Code API helper
function sendToExtension(message: { type: string; payload: any }) {
  if (typeof window !== 'undefined' && (window as any).vscode) {
    (window as any).vscode.postMessage({
      ...message,
      timestamp: Date.now(),
      uuid: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    });
  }
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  // State
  currentSessionId: '',
  sessions: [],
  capabilities: [],

  // Actions
  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) => set((state) => ({
    sessions: [...state.sessions, session]
  })),

  updateSession: (id, updates) => set((state) => ({
    sessions: state.sessions.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    )
  })),

  removeSession: (id) => set((state) => ({
    sessions: state.sessions.filter((s) => s.id !== id)
  })),

  setCapabilities: (capabilities) => set({ capabilities }),

  getSessionById: (id) => get().sessions.find((s) => s.id === id),

  // 会话操作
  requestSessionList: () => {
    sendToExtension({
      type: 'session/list',
      payload: {}
    });
  },

  loadSession: (sessionId) => {
    sendToExtension({
      type: 'session/load',
      payload: { sessionId }
    });
  },

  createNewSession: () => {
    sendToExtension({
      type: 'session/create',
      payload: {}
    });
  }
}));

// 选择器 helpers
export const selectCurrentSessionId = (state: SessionStore) => state.currentSessionId;
export const selectSessions = (state: SessionStore) => state.sessions;
export const selectCapabilities = (state: SessionStore) => state.capabilities;
