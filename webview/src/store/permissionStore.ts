import { create } from 'zustand';

export interface PermissionRequest {
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
}

interface PermissionStoreState {
  pendingRequests: PermissionRequest[];
}

interface PermissionStoreActions {
  addRequest: (request: PermissionRequest) => void;
  removeRequest: (toolUseId: string) => void;
  clearRequests: () => void;
  getRequestByToolUseId: (toolUseId: string) => PermissionRequest | undefined;
}

type PermissionStore = PermissionStoreState & PermissionStoreActions;

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  // State
  pendingRequests: [],

  // Actions
  addRequest: (request) => set((state) => ({
    pendingRequests: [...state.pendingRequests, request]
  })),

  removeRequest: (toolUseId) => set((state) => ({
    pendingRequests: state.pendingRequests.filter((r) => r.toolUseId !== toolUseId)
  })),

  clearRequests: () => set({ pendingRequests: [] }),

  getRequestByToolUseId: (toolUseId) =>
    get().pendingRequests.find((r) => r.toolUseId === toolUseId),
}));

// 选择器 helpers
export const selectPendingRequests = (state: PermissionStore) => state.pendingRequests;
export const selectHasPendingRequests = (state: PermissionStore) => state.pendingRequests.length > 0;
