import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  memo,
  useMemo
} from 'react';
import { UserMessage } from '../UserMessage';
import { AssistantMessage } from '../AssistantMessage';
import { SystemMessage } from '../SystemMessage';
import { ErrorMessage } from '../ErrorMessage';
import { ToolMessage } from '../ToolMessage';
import { WaitingIndicator } from '../WaitingIndicator';
import { Codicon } from '../../common';
import type { ChatMessage } from '../../../types/messages';
import styles from './MessageContainer.module.css';

interface MessageContainerProps {
  messages: ChatMessage[];
  onSaveEditMessage?: (index: number, content: string) => void;
}

export interface MessageContainerRef {
  scrollToBottom: (smooth?: boolean) => void;
  isAtBottom: () => boolean;
}

/**
 * Extract tool_use_id from message
 */
function getToolUseId(message: ChatMessage): string {
  if (message.contentBlocks && message.contentBlocks.length > 0) {
    for (const block of message.contentBlocks) {
      if (block.type === 'tool_use' && block.id) {
        return block.id;
      }
    }
  }
  return message.id;
}

export const MessageContainer = memo(forwardRef<MessageContainerRef, MessageContainerProps>(
  function MessageContainer({ messages, onSaveEditMessage }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const bottomSentinelRef = useRef<HTMLDivElement>(null);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [activeStickyIndex, setActiveStickyIndex] = useState<number>(-1);
    const [pageHeight, setPageHeight] = useState<number>(0);
    const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

    // Scroll to bottom
    const scrollToBottom = useCallback((smooth = false) => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      scrollToBottom,
      isAtBottom: () => isAtBottom
    }), [scrollToBottom, isAtBottom]);

    // Handle edit requests
    const handleRequestEdit = useCallback((index: number) => {
      setEditingIndex(index);
    }, []);

    const handleCancelEdit = useCallback(() => {
      setEditingIndex(null);
    }, []);

    const handleSaveEdit = useCallback((index: number, content: string) => {
      onSaveEditMessage?.(index, content);
      setEditingIndex(null);
    }, [onSaveEditMessage]);

    // Should show waiting indicator
    const shouldShowWaiting = useMemo(() => {
      if (messages.length === 0) return false;

      const lastMessage = messages[messages.length - 1];

      if (lastMessage.role === 'user') {
        const hasStreamingAssistant = messages.some(
          msg => msg.role === 'assistant' && msg.streaming
        );
        return !hasStreamingAssistant;
      }

      return false;
    }, [messages]);

    // Update page height
    const updatePageHeight = useCallback(() => {
      if (!containerRef.current) return;
      setPageHeight(containerRef.current.clientHeight);
    }, []);

    // Update active sticky
    const updateActiveSticky = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;

      const containerTop = el.getBoundingClientRect().top;
      const userNodes = Array.from(el.querySelectorAll(`.${styles.userMessage}`)) as HTMLElement[];

      let candidate = -1;
      let minDiff = Number.POSITIVE_INFINITY;

      for (const node of userNodes) {
        const rect = node.getBoundingClientRect();
        const diff = Math.abs(rect.top - containerTop);
        if (rect.top <= containerTop + 1) {
          if (diff < minDiff) {
            minDiff = diff;
            const idxAttr = node.getAttribute('data-message-index');
            const idx = idxAttr ? parseInt(idxAttr, 10) : -1;
            if (!Number.isNaN(idx)) candidate = idx;
          }
        }
      }

      if (candidate === -1) {
        for (const node of userNodes) {
          const rect = node.getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          const intersect = rect.bottom > containerRect.top && rect.top < containerRect.bottom;
          if (intersect) {
            const idxAttr = node.getAttribute('data-message-index');
            const idx = idxAttr ? parseInt(idxAttr, 10) : -1;
            candidate = idx;
            break;
          }
        }
      }

      setActiveStickyIndex(candidate);
    }, []);

    // Handle scroll
    const handleScroll = useCallback(() => {
      updateActiveSticky();
    }, [updateActiveSticky]);

    // ResizeObserver for container and last item
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const resizeObserver = new ResizeObserver(() => {
        updatePageHeight();
        updateActiveSticky();
      });

      resizeObserver.observe(el);

      return () => resizeObserver.disconnect();
    }, [updatePageHeight, updateActiveSticky]);

    // ResizeObserver for last message item
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const items = el.querySelectorAll(`.${styles.messageItem}`);
      const last = items[items.length - 1] as HTMLElement | undefined;
      if (!last) return;

      const lastItemObserver = new ResizeObserver(() => {
        if (isAtBottom) {
          requestAnimationFrame(() => scrollToBottom(false));
        }
        updateActiveSticky();
      });

      lastItemObserver.observe(last);

      return () => lastItemObserver.disconnect();
    }, [messages.length, isAtBottom, scrollToBottom, updateActiveSticky]);

    // IntersectionObserver for bottom sentinel
    useEffect(() => {
      const el = containerRef.current;
      const sentinel = bottomSentinelRef.current;
      if (!el || !sentinel) return;

      const bottomObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === sentinel) {
              setIsAtBottom(entry.isIntersecting);
            }
          }
        },
        {
          root: el,
          rootMargin: '0px 0px -80px 0px',
          threshold: 0
        }
      );

      bottomObserver.observe(sentinel);

      return () => bottomObserver.disconnect();
    }, []);

    // Auto scroll on new messages
    useEffect(() => {
      updatePageHeight();
      updateActiveSticky();
      if (isAtBottom) {
        scrollToBottom(false);
      }
    }, [messages.length, isAtBottom, scrollToBottom, updatePageHeight, updateActiveSticky]);

    return (
      <div
        ref={containerRef}
        className={styles.messagesContainer}
        onScroll={handleScroll}
      >
        {messages.map((message, index) => (
          <div key={message.id || index} className={styles.messageItem}>
            {/* User message */}
            {message.role === 'user' && (
              <UserMessage
                message={message}
                messageIndex={index}
                tabIndex={index}
                isEditing={editingIndex === index}
                sticky={index === activeStickyIndex}
                onRequestEdit={() => handleRequestEdit(index)}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={(content) => handleSaveEdit(index, content)}
              />
            )}

            {/* Tool message */}
            {message.role === 'assistant' && message.type === 'tool_use' && (
              <ToolMessage
                toolUseId={getToolUseId(message)}
                messageIndex={index}
                tabIndex={index}
              />
            )}

            {/* Assistant message */}
            {message.role === 'assistant' && message.type !== 'tool_use' && (
              <AssistantMessage
                message={message}
                messageIndex={index}
                tabIndex={index}
                streaming={message.streaming}
              />
            )}

            {/* Error message */}
            {message.role === 'error' && (
              <ErrorMessage
                message={message}
                messageIndex={index}
                tabIndex={index}
              />
            )}

            {/* System message */}
            {message.role === 'system' && (
              <SystemMessage
                message={message}
                messageIndex={index}
                tabIndex={index}
              />
            )}

            {/* Unknown message type */}
            {!['user', 'assistant', 'error', 'system'].includes(message.role) && (
              <div
                tabIndex={index}
                data-message-index={index}
                className={styles.rawMessage}
              >
                <div className={styles.messageHeader}>
                  <Codicon name="question" />
                  <span className={styles.messageRole}>未知消息类型</span>
                </div>
                <pre>{JSON.stringify(message, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}

        {/* Waiting indicator */}
        {shouldShowWaiting && (
          <div style={{ minHeight: pageHeight > 0 ? `${pageHeight}px` : '0px' }} className={styles.waitingSpacer}>
            <WaitingIndicator />
          </div>
        )}

        {/* Bottom sentinel */}
        <div ref={bottomSentinelRef} className={styles.bottomSentinel} aria-hidden="true" />
      </div>
    );
  }
));

export default MessageContainer;
