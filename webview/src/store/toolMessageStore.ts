import { create } from 'zustand';

/**
 * 工具消息状态接口
 */
export interface ToolMessageState {
  toolUseId: string;
  toolUse?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
  toolResult?: {
    content: unknown;
    is_error?: boolean;
    tool_use_id: string;
  };
  toolUseResult?: unknown; // 工具执行的额外结果数据（如 structuredPatch）
  permissionState: 'none' | 'pending' | 'allowed' | 'denied';
  correlationId?: string; // 用于权限请求
}

interface ToolMessageStoreState {
  toolMessages: Map<string, ToolMessageState>;
}

interface ToolMessageStoreActions {
  getToolMessage: (toolUseId: string) => ToolMessageState | undefined;
  upsertToolMessage: (toolUseId: string, data: Partial<ToolMessageState>) => ToolMessageState;
  setToolUse: (toolUse: { id: string; name: string; input: Record<string, unknown> }) => ToolMessageState;
  setToolResult: (toolResult: { content: unknown; is_error?: boolean; tool_use_id: string }) => ToolMessageState;
  setPermissionRequest: (toolUseId: string, correlationId: string) => ToolMessageState;
  setPermissionResponse: (toolUseId: string, allowed: boolean) => ToolMessageState;
  findToolUseIdByCorrelationId: (correlationId: string) => string | undefined;
  clearToolMessages: () => void;
}

type ToolMessageStore = ToolMessageStoreState & ToolMessageStoreActions;

export const useToolMessageStore = create<ToolMessageStore>((set, get) => ({
  // State
  toolMessages: new Map(),

  // Actions
  getToolMessage: (toolUseId) => get().toolMessages.get(toolUseId),

  upsertToolMessage: (toolUseId, data) => {
    const state = get();
    const existing = state.toolMessages.get(toolUseId) || {
      toolUseId,
      permissionState: 'none' as const
    };

    const updated = { ...existing, ...data };
    const newMap = new Map(state.toolMessages);
    newMap.set(toolUseId, updated);
    set({ toolMessages: newMap });

    return updated;
  },

  setToolUse: (toolUse) => {
    return get().upsertToolMessage(toolUse.id, { toolUse });
  },

  setToolResult: (toolResult) => {
    return get().upsertToolMessage(toolResult.tool_use_id, { toolResult });
  },

  setPermissionRequest: (toolUseId, correlationId) => {
    return get().upsertToolMessage(toolUseId, {
      permissionState: 'pending',
      correlationId
    });
  },

  setPermissionResponse: (toolUseId, allowed) => {
    return get().upsertToolMessage(toolUseId, {
      permissionState: allowed ? 'allowed' : 'denied'
    });
  },

  findToolUseIdByCorrelationId: (correlationId) => {
    for (const [toolUseId, state] of get().toolMessages.entries()) {
      if (state.correlationId === correlationId) {
        return toolUseId;
      }
    }
    return undefined;
  },

  clearToolMessages: () => set({ toolMessages: new Map() }),
}));

// 选择器 helpers
export const selectToolMessages = (state: ToolMessageStore) => state.toolMessages;

// 独立函数导出 (用于非 React 组件场景)
export const getToolMessage = (toolUseId: string) =>
  useToolMessageStore.getState().getToolMessage(toolUseId);

export const upsertToolMessage = (toolUseId: string, data: Partial<ToolMessageState>) =>
  useToolMessageStore.getState().upsertToolMessage(toolUseId, data);

export const setToolUse = (toolUse: { id: string; name: string; input: Record<string, unknown> }) =>
  useToolMessageStore.getState().setToolUse(toolUse);

export const setToolResult = (toolResult: { content: unknown; is_error?: boolean; tool_use_id: string }) =>
  useToolMessageStore.getState().setToolResult(toolResult);

export const setPermissionRequest = (toolUseId: string, correlationId: string) =>
  useToolMessageStore.getState().setPermissionRequest(toolUseId, correlationId);

export const setPermissionResponse = (toolUseId: string, allowed: boolean) =>
  useToolMessageStore.getState().setPermissionResponse(toolUseId, allowed);
