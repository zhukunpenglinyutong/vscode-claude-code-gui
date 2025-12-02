import { useEffect, useCallback, useRef } from 'react';
import { useChatStore, useSessionStore, usePermissionStore, useMessageQueueStore } from '../store';
import type {
  VSCodeAPI,
  ExtensionMessage,
  WebviewMessage,
  ClaudeEventMessage,
  ChatMessage
} from '../../types/messages';
import type { SDKMessage } from '@anthropic-ai/claude-code';
import {
  extractTextContent,
  extractContentBlocks
} from '../utils/messageUtils';
import { isSDKUserMessage, isSDKAssistantMessage } from '../../types/messages';
import { useToolMessageStore } from '../store/toolMessageStore';

// VS Code API 实例（全局单例）
let vscodeApi: VSCodeAPI | undefined;

function getVSCodeApi(): VSCodeAPI | undefined {
  if (vscodeApi) return vscodeApi;

  if (typeof window !== 'undefined') {
    if ((window as any).vscode) {
      vscodeApi = (window as any).vscode;
    } else if ((window as any).acquireVsCodeApi) {
      try {
        vscodeApi = (window as any).acquireVsCodeApi();
        (window as any).vscode = vscodeApi;
      } catch (error) {
        console.error('[useMessageBus] 获取 VSCode API 失败:', error);
      }
    }
  }
  return vscodeApi;
}

// 消息序列号
let messageSequence = 0;

/**
 * 发送消息到 Extension
 */
export function sendMessage<T extends WebviewMessage>(message: T): void {
  const vscode = getVSCodeApi();
  if (!vscode) {
    console.warn('[useMessageBus] VSCode API 不可用，消息被丢弃:', message.type);
    return;
  }

  const enrichedMessage = {
    ...message,
    timestamp: Date.now(),
    uuid: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    metadata: {
      version: '1.0.0',
      source: 'webview' as const,
      timestamp: Date.now(),
      sequence: ++messageSequence
    }
  };

  vscode.postMessage(enrichedMessage);
  console.log('[useMessageBus] 发送消息:', message.type, message.payload);
}

/**
 * 消息总线 Hook - 处理与 Extension 的通信
 */
export function useMessageBus() {
  const handlersRef = useRef<Map<string, Set<Function>>>(new Map());

  // Chat store actions
  const addMessage = useChatStore((state) => state.addMessage);
  const addMessages = useChatStore((state) => state.addMessages);
  const setMessages = useChatStore((state) => state.setMessages);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const setCurrentRequest = useChatStore((state) => state.setCurrentRequest);
  const setStreamingMessage = useChatStore((state) => state.setStreamingMessage);
  const removeStreamingMessage = useChatStore((state) => state.removeStreamingMessage);
  const clearStreamingMessages = useChatStore((state) => state.clearStreamingMessages);
  const getStreamingMessageIndex = useChatStore((state) => state.getStreamingMessageIndex);
  const messages = useChatStore((state) => state.messages);

  // Session store actions
  const setSessions = useSessionStore((state) => state.setSessions);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);
  const setCapabilities = useSessionStore((state) => state.setCapabilities);

  // Permission store actions
  const addPermissionRequest = usePermissionStore((state) => state.addRequest);
  const removePermissionRequest = usePermissionStore((state) => state.removeRequest);

  // Tool message store actions
  const setToolUse = useToolMessageStore((state) => state.setToolUse);
  const setToolResult = useToolMessageStore((state) => state.setToolResult);
  const setPermissionRequest = useToolMessageStore((state) => state.setPermissionRequest);
  const setPermissionResponse = useToolMessageStore((state) => state.setPermissionResponse);
  const upsertToolMessage = useToolMessageStore((state) => state.upsertToolMessage);

  // Message queue actions
  const popNextMessage = useMessageQueueStore((state) => state.popNextMessage);

  /**
   * 注册消息处理器
   */
  const on = useCallback(<T extends ExtensionMessage['type']>(
    type: T,
    handler: (message: Extract<ExtensionMessage, { type: T }>) => void
  ): () => void => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }

    handlersRef.current.get(type)!.add(handler);

    return () => {
      const handlers = handlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(type);
        }
      }
    };
  }, []);

  /**
   * 转换 SDK 消息为 UI 消息
   */
  const convertToUIMessage = useCallback((sdkMessage: SDKMessage): ChatMessage | ChatMessage[] | null => {
    if (!sdkMessage) return null;

    if ((sdkMessage as any).isMeta) {
      return null;
    }

    const content = extractTextContent(sdkMessage);
    const contentBlocks = extractContentBlocks(sdkMessage);

    switch (sdkMessage.type) {
      case 'user': {
        const messageObj = (sdkMessage as Record<string, any>).message;
        if (messageObj && Array.isArray(messageObj.content)) {
          const firstBlock = messageObj.content[0];
          if (firstBlock && firstBlock.type === 'tool_result') {
            messageObj.content.forEach((block: Record<string, any>) => {
              if (block.type === 'tool_result' && block.tool_use_id) {
                setToolResult({
                  content: block.content,
                  is_error: Boolean(block.is_error),
                  tool_use_id: block.tool_use_id
                });

                const toolUseResult = (sdkMessage as Record<string, any>).toolUseResult;
                if (toolUseResult) {
                  upsertToolMessage(block.tool_use_id, { toolUseResult });
                }
              }
            });
            return null;
          }
        }

        if (content && content.trim()) {
          if (content.includes('[Request interrupted by')) {
            return {
              id: `system_${Date.now()}_${Math.random()}`,
              sdkMessage,
              role: 'system',
              content,
              contentBlocks,
              timestamp: Date.now(),
              status: 'sent',
              sessionId: sdkMessage.session_id
            };
          }

          return {
            id: `user_${Date.now()}_${Math.random()}`,
            sdkMessage,
            role: 'user',
            content,
            contentBlocks,
            timestamp: Date.now(),
            status: 'sent',
            sessionId: sdkMessage.session_id
          };
        }
        return null;
      }
      case 'assistant': {
        const messageObj = (sdkMessage as Record<string, any>).message;
        const messages: ChatMessage[] = [];

        if (messageObj && Array.isArray(messageObj.content)) {
          let textContent = '';
          let hasText = false;

          messageObj.content.forEach((block: Record<string, any>) => {
            if (block.type === 'text' && typeof block.text === 'string') {
              textContent += block.text;
              hasText = true;
            } else if (block.type === 'tool_use' && block.id && block.name) {
              const toolMessage: ChatMessage = {
                id: `tool_${block.id}`,
                sdkMessage,
                role: 'assistant',
                content: `使用工具: ${block.name}`,
                contentBlocks: [{
                  type: 'tool_use',
                  id: block.id,
                  name: block.name,
                  input: block.input
                }],
                timestamp: Date.now(),
                status: 'sent',
                sessionId: sdkMessage.session_id || '',
                type: 'tool_use'
              };
              messages.push(toolMessage);

              setToolUse({
                id: block.id,
                name: block.name,
                input: block.input
              });
            }
          });

          if (hasText && textContent.trim()) {
            messages.push({
              id: `assistant_${Date.now()}_${Math.random()}`,
              sdkMessage,
              role: 'assistant',
              content: textContent,
              contentBlocks: [{ type: 'text', text: textContent }],
              timestamp: Date.now(),
              status: 'completed',
              sessionId: sdkMessage.session_id || ''
            });
          }
        }

        return messages.length > 0 ? (messages.length === 1 ? messages[0] : messages) : null;
      }
      case 'result':
      case 'system':
        return {
          id: `${sdkMessage.type}_${Date.now()}_${Math.random()}`,
          sdkMessage,
          role: 'system',
          content,
          contentBlocks,
          timestamp: Date.now(),
          status: 'completed',
          sessionId: sdkMessage.session_id
        };
      default:
        return null;
    }
  }, [setToolResult, setToolUse, upsertToolMessage]);

  /**
   * 处理 Claude 事件
   */
  const handleClaudeEvent = useCallback((message: ClaudeEventMessage) => {
    const event = message.payload;
    console.log('[useMessageBus] Claude 事件:', event.kind, event);

    switch (event.kind) {
      case 'user': {
        if (!event.message) return;
        const sdkMessage = event.message;

        if (!isSDKUserMessage(sdkMessage)) return;
        if ((sdkMessage as any).isMeta) return;

        const messageObj = (sdkMessage as Record<string, any>).message;
        if (!messageObj || !messageObj.content) return;

        const messageContent = messageObj.content;

        if (typeof messageContent === 'string') {
          if (messageContent.includes('[Request interrupted by')) {
            addMessage({
              id: `system_${Date.now()}`,
              sdkMessage,
              role: 'system',
              content: messageContent,
              contentBlocks: [{ type: 'text', text: messageContent }],
              timestamp: Date.now(),
              status: 'sent',
              sessionId: sdkMessage.session_id || ''
            });
          } else {
            addMessage({
              id: `user_${Date.now()}`,
              sdkMessage,
              role: 'user',
              content: messageContent,
              contentBlocks: [{ type: 'text', text: messageContent }],
              timestamp: Date.now(),
              status: 'sent',
              sessionId: sdkMessage.session_id || ''
            });
          }
        } else if (Array.isArray(messageContent)) {
          const firstBlock = messageContent[0];

          if (firstBlock && firstBlock.type === 'tool_result') {
            messageContent.forEach((block: Record<string, any>) => {
              if (block.type === 'tool_result' && block.tool_use_id) {
                const toolUseResult = (sdkMessage as Record<string, any>).toolUseResult;

                setToolResult({
                  content: block.content,
                  is_error: Boolean(block.is_error),
                  tool_use_id: block.tool_use_id
                });

                if (toolUseResult) {
                  upsertToolMessage(block.tool_use_id, { toolUseResult });
                }
              }
            });
          } else {
            let textContent = '';
            messageContent.forEach((block: Record<string, any>) => {
              if (block.type === 'text' && typeof block.text === 'string') {
                textContent += block.text;
              }
            });

            if (textContent.trim()) {
              if (textContent.includes('[Request interrupted by')) {
                addMessage({
                  id: `system_${Date.now()}`,
                  sdkMessage,
                  role: 'system',
                  content: textContent,
                  contentBlocks: [{ type: 'text', text: textContent }],
                  timestamp: Date.now(),
                  status: 'sent',
                  sessionId: sdkMessage.session_id || ''
                });
              } else {
                addMessage({
                  id: `user_${Date.now()}`,
                  sdkMessage,
                  role: 'user',
                  content: textContent,
                  contentBlocks: [{ type: 'text', text: textContent }],
                  timestamp: Date.now(),
                  status: 'sent',
                  sessionId: sdkMessage.session_id || ''
                });
              }
            }
          }
        }
        break;
      }

      case 'assistant': {
        if (!event.message || event.message.type !== 'assistant') return;
        const sdkMessage = event.message;

        if (!isSDKAssistantMessage(sdkMessage)) return;

        const messageObj = (sdkMessage as Record<string, any>).message;
        if (!messageObj || !messageObj.content) return;

        const messageContent = messageObj.content;
        let textContent = '';
        let hasTextContent = false;

        if (Array.isArray(messageContent)) {
          messageContent.forEach((block: Record<string, any>) => {
            if (block.type === 'text' && typeof block.text === 'string') {
              textContent += block.text;
              hasTextContent = true;
            } else if (block.type === 'tool_use' && block.id && block.name) {
              // 创建工具消息
              addMessage({
                id: `tool_${block.id}`,
                sdkMessage,
                role: 'assistant',
                content: `使用工具: ${block.name}`,
                contentBlocks: [{
                  type: 'tool_use',
                  id: block.id,
                  name: block.name,
                  input: block.input
                }],
                timestamp: Date.now(),
                status: 'sent',
                sessionId: (sdkMessage as Record<string, any>).session_id || '',
                type: 'tool_use'
              });

              setToolUse({
                id: block.id,
                name: block.name,
                input: block.input
              });
            }
          });
        }

        if (hasTextContent && textContent.trim()) {
          const sessionId = sdkMessage.session_id || '';
          const existingIndex = getStreamingMessageIndex(sessionId);

          if (existingIndex !== undefined) {
            updateMessage(messages[existingIndex]?.id || '', {
              content: textContent,
              contentBlocks: [{ type: 'text', text: textContent }],
              streaming: false,
              status: 'completed',
              sdkMessage
            });
            removeStreamingMessage(sessionId);
          } else {
            addMessage({
              id: `assistant_${Date.now()}`,
              sdkMessage,
              role: 'assistant',
              content: textContent,
              contentBlocks: [{ type: 'text', text: textContent }],
              timestamp: Date.now(),
              status: 'completed',
              streaming: false,
              sessionId
            });
          }
        }
        break;
      }

      case 'stream_event': {
        if (!event.message || event.message.type !== 'stream_event') return;

        const sdkMessage = event.message;
        const sessionId = sdkMessage.session_id || 'default';
        const deltaText = extractTextContent(sdkMessage);

        if (!deltaText) return;

        const existingIndex = getStreamingMessageIndex(sessionId);

        if (existingIndex !== undefined) {
          const existingMessage = messages[existingIndex];
          if (existingMessage) {
            const newContent = existingMessage.content + deltaText;
            updateMessage(existingMessage.id, {
              content: newContent,
              contentBlocks: [{ type: 'text', text: newContent }]
            });
          }
        } else {
          const newMessage: ChatMessage = {
            id: `stream_${Date.now()}`,
            sdkMessage,
            role: 'assistant',
            content: deltaText,
            contentBlocks: [{ type: 'text', text: deltaText }],
            timestamp: Date.now(),
            status: 'streaming',
            streaming: true,
            sessionId: sdkMessage.session_id,
            metadata: {
              parentToolUseId: sdkMessage.parent_tool_use_id || undefined
            }
          };

          addMessage(newMessage);
          setStreamingMessage(sessionId, messages.length);
        }
        break;
      }

      case 'permission_request': {
        const request = {
          toolUseId: event.toolUseId,
          toolName: event.toolName,
          input: event.input,
          timestamp: Date.now()
        };

        addPermissionRequest(request);
        setPermissionRequest(event.toolUseId, event.toolUseId);
        break;
      }

      case 'permission_decision': {
        const allowed = event.result?.behavior === 'allow';
        setPermissionResponse(event.toolUseId, allowed);
        removePermissionRequest(event.toolUseId);
        break;
      }

      case 'error': {
        const content = `错误: ${event.message}`;
        addMessage({
          id: `error_${Date.now()}`,
          role: 'error',
          content,
          contentBlocks: [{ type: 'text', text: content }],
          timestamp: Date.now(),
          status: 'error',
          metadata: { error: event.message }
        });
        break;
      }

      case 'result': {
        setCurrentRequest(null);
        clearStreamingMessages();

        // 处理下一个队列消息
        const nextMessage = popNextMessage();
        if (nextMessage) {
          sendChatMessage(nextMessage.content);
        }
        break;
      }

      case 'system':
        console.log('[useMessageBus] 系统消息:', event);
        break;
    }
  }, [
    addMessage, updateMessage, setCurrentRequest, setStreamingMessage,
    removeStreamingMessage, clearStreamingMessages, getStreamingMessageIndex, messages,
    addPermissionRequest, removePermissionRequest, setToolUse, setToolResult,
    setPermissionRequest, setPermissionResponse, upsertToolMessage, popNextMessage
  ]);

  // 设置消息监听
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = event.data as ExtensionMessage;
        console.log('[useMessageBus] 接收消息:', message.type, message.payload);

        // 调用注册的处理器
        const handlers = handlersRef.current.get(message.type);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error(`[useMessageBus] 处理器错误 ${message.type}:`, error);
            }
          });
        }

        // 处理内置事件
        switch (message.type) {
          case 'claude/event':
            handleClaudeEvent(message as ClaudeEventMessage);
            break;
          case 'session/list':
            setSessions(message.payload.sessions);
            break;
          case 'session/current':
            setCurrentSessionId(message.payload.sessionId);
            const uiMessages: ChatMessage[] = [];
            for (const msg of message.payload.messages) {
              const result = convertToUIMessage(msg);
              if (result) {
                if (Array.isArray(result)) {
                  uiMessages.push(...result);
                } else {
                  uiMessages.push(result);
                }
              }
            }
            setMessages(uiMessages);
            break;
          case 'session/created':
            setCurrentSessionId(message.payload.sessionId || '');
            setMessages([]);
            break;
          case 'system/ready':
            setCapabilities(message.payload.capabilities);
            break;
          case 'system/error':
            console.error('[useMessageBus] 系统错误:', message.payload.message);
            break;
        }
      } catch (error) {
        console.error('[useMessageBus] 处理接收消息失败:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    handleClaudeEvent, setSessions, setCurrentSessionId, setCapabilities,
    setMessages, convertToUIMessage
  ]);

  // 初始化时获取 VS Code API
  useEffect(() => {
    getVSCodeApi();
  }, []);

  return {
    on,
    send: sendMessage,
    isConnected: () => !!getVSCodeApi()
  };
}

// ========== 便捷 API ==========

/**
 * 发送聊天消息
 */
export function sendChatMessage(text: string, sessionId?: string): string {
  const requestId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  useChatStore.getState().setCurrentRequest({
    id: requestId,
    status: 'sending',
    startTime: Date.now()
  });

  sendMessage({
    type: 'chat/send',
    payload: { text, sessionId }
  });

  return requestId;
}

/**
 * 中断聊天请求
 */
export function interruptChat(): void {
  sendMessage({
    type: 'chat/interrupt',
    payload: {}
  });

  useChatStore.getState().setCurrentRequest(null);
  useChatStore.getState().clearStreamingMessages();
}

/**
 * 加载会话
 */
export function loadSession(sessionId: string): void {
  sendMessage({
    type: 'session/load',
    payload: { sessionId }
  });
}

/**
 * 创建新会话
 */
export function createNewSession(): void {
  sendMessage({
    type: 'session/create',
    payload: {}
  });
}

/**
 * 请求会话列表
 */
export function requestSessionList(): void {
  sendMessage({
    type: 'session/list',
    payload: {}
  });
}

/**
 * 响应权限请求
 */
export function respondToPermission(
  toolUseId: string,
  behavior: 'allow' | 'deny',
  options?: {
    updatedInput?: any;
    message?: string;
    interrupt?: boolean;
  }
): void {
  sendMessage({
    type: 'permission/response',
    payload: {
      toolUseId,
      result: { behavior, ...options }
    }
  });

  usePermissionStore.getState().removeRequest(toolUseId);
}

/**
 * 通知 UI 就绪
 */
export function notifyUIReady(): void {
  sendMessage({
    type: 'ui/ready',
    payload: {}
  });
}

/**
 * 添加消息到队列
 */
export function addMessageToQueue(content: string): void {
  useMessageQueueStore.getState().addMessage(content);
}

/**
 * 从队列中移除消息
 */
export function removeMessageFromQueue(messageId: string): void {
  useMessageQueueStore.getState().removeMessage(messageId);
}

/**
 * 清空消息队列
 */
export function clearMessageQueue(): void {
  useMessageQueueStore.getState().clearQueue();
}

/**
 * 处理下一个队列消息
 */
export function processNextQueuedMessage(): void {
  const nextMessage = useMessageQueueStore.getState().popNextMessage();
  if (nextMessage) {
    sendChatMessage(nextMessage.content);
  }
}
