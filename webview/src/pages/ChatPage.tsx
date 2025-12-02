import React, { memo, useRef, useCallback, useEffect, useMemo } from 'react';
import { useChatStore, useSessionStore, useMessageQueueStore } from '../store';
import {
  sendChatMessage,
  interruptChat,
  createNewSession,
  addMessageToQueue,
  removeMessageFromQueue
} from '../hooks/useMessageBus';
import { MessageContainer, MessageContainerRef } from '../components/Messages';
import { ChatInputBox } from '../components';
import { Codicon, ClaudeWordmark } from '../components/common';

interface ChatPageProps {
  onSwitchToSessions?: () => void;
}

export const ChatPage = memo(function ChatPage({ onSwitchToSessions }: ChatPageProps) {
  const messageContainerRef = useRef<MessageContainerRef>(null);

  // Store state
  const messages = useChatStore((state) => state.messages);
  const currentRequest = useChatStore((state) => state.currentRequest);
  const currentSessionId = useSessionStore((state) => state.currentSessionId);
  const sessions = useSessionStore((state) => state.sessions);
  const queuedMessages = useMessageQueueStore((state) => state.queuedMessages);

  // Computed values
  const chatTitle = useMemo(() => {
    if (currentSessionId) {
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession?.label) {
        return currentSession.label;
      }
    }
    return '新对话';
  }, [currentSessionId, sessions]);

  const conversationWorking = currentRequest !== null;

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    messageContainerRef.current?.scrollToBottom(smooth);
  }, []);

  // Handle submit
  const handleSubmit = useCallback((content: string) => {
    if (!content.trim()) return;
    sendChatMessage(content);
  }, []);

  // Handle queue message
  const handleQueueMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    addMessageToQueue(content);
  }, []);

  // Handle stop
  const handleStop = useCallback(() => {
    interruptChat();
  }, []);

  // Handle queue remove
  const handleQueueRemove = useCallback((messageId: string) => {
    removeMessageFromQueue(messageId);
  }, []);

  // Handle queue send now
  const handleQueueSendNow = useCallback((messageId: string) => {
    const message = queuedMessages.find(msg => msg.id === messageId);
    if (!message) return;

    if (conversationWorking) {
      interruptChat();
    }

    removeMessageFromQueue(messageId);

    setTimeout(() => {
      sendChatMessage(message.content);
    }, 100);
  }, [queuedMessages, conversationWorking]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    createNewSession();
  }, []);

  // Handle save edit message
  const handleSaveEditMessage = useCallback((index: number, content: string) => {
    console.log('Save edit message:', index, content);
    // TODO: Implement message edit functionality
  }, []);

  // Watch for session changes and scroll to bottom
  useEffect(() => {
    if (currentSessionId) {
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [currentSessionId, scrollToBottom]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-vscode-panel-border min-h-8 px-3">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center w-6 h-6 border-none bg-transparent text-vscode-titlebar-fg rounded cursor-pointer transition-colors duration-200 opacity-70 hover:bg-vscode-toolbar-hover hover:opacity-100 [&_span]:text-xs"
            onClick={onSwitchToSessions}
          >
            <Codicon name="menu" />
          </button>
          <h2 className="m-0 text-xs font-semibold text-vscode-titlebar-fg">{chatTitle}</h2>
        </div>
        <div className="flex gap-1">
          <button
            className="flex items-center justify-center w-6 h-6 border-none bg-transparent text-vscode-titlebar-fg rounded cursor-pointer transition-colors duration-200 opacity-70 hover:bg-vscode-toolbar-hover hover:opacity-100 [&_span]:text-xs"
            onClick={handleNewChat}
            title="新开对话"
          >
            <Codicon name="plus" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative overflow-hidden [&>:first-child]:flex-1 [&>:first-child]:overflow-y-auto [&>:first-child]:overflow-x-hidden [&>:first-child]:py-3">
        {/* Message container */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 px-4">
            <div className="flex items-start justify-center mb-6 gap-1 relative">
              <ClaudeWordmark className="text-vscode-fg" />
              <span className="text-[10px] font-semibold text-primary py-[3px] px-1.5 rounded bg-primary-bg border border-primary-border mt-[1px] leading-tight shadow-[0_0_8px_rgba(147,51,234,0.25),0_0_16px_rgba(147,51,234,0.15),inset_0_0_8px_rgba(147,51,234,0.1)] backdrop-blur-[4px] tracking-wide">
                v0.0.1
              </span>
            </div>
          </div>
        ) : (
          <MessageContainer
            ref={messageContainerRef}
            messages={messages}
            onSaveEditMessage={handleSaveEditMessage}
          />
        )}

        {/* Input area */}
        <div className="flex flex-col items-stretch justify-center relative mx-2.5 mb-2.5 w-full self-center px-3 max-w-[1200px] box-border">
          {/* Message queue display */}
          {queuedMessages.length > 0 && (
            <div className="bg-[color-mix(in_srgb,var(--vscode-editor-background)_50%,transparent)] border border-vscode-panel-border rounded-md mb-2 p-2">
              <div className="flex items-center gap-1 text-xs text-vscode-fg opacity-70 mb-2">
                <Codicon name="list-ordered" />
                <span>{queuedMessages.length} 队列中</span>
              </div>
              {queuedMessages.map(msg => (
                <div key={msg.id} className="flex items-center gap-2 py-1 px-2 bg-vscode-input-bg rounded mb-1 last:mb-0">
                  <span className="flex-1 text-[13px] text-vscode-fg overflow-hidden text-ellipsis whitespace-nowrap">{msg.content}</span>
                  <button
                    className="flex items-center justify-center w-5 h-5 border-none bg-transparent text-vscode-fg rounded cursor-pointer opacity-60 hover:bg-vscode-toolbar-hover hover:opacity-100"
                    onClick={() => handleQueueRemove(msg.id)}
                    title="移除"
                  >
                    <Codicon name="trash" size={12} />
                  </button>
                  <button
                    className="flex items-center justify-center w-5 h-5 border-none bg-transparent text-vscode-fg rounded cursor-pointer opacity-60 hover:bg-vscode-toolbar-hover hover:opacity-100"
                    onClick={() => handleQueueSendNow(msg.id)}
                    title="立即发送"
                  >
                    <Codicon name="arrow-up" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input box */}
          <ChatInputBox
            showProgress={true}
            progressPercentage={48.7}
            conversationWorking={conversationWorking}
            onSubmit={handleSubmit}
            onQueueMessage={handleQueueMessage}
            onStop={handleStop}
          />
        </div>
      </main>
    </div>
  );
});

export default ChatPage;
