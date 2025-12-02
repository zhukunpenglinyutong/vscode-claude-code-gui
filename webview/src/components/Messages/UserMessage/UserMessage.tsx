import React, { memo, useRef, useEffect, useCallback } from 'react';
import { Codicon } from '../../common';
import type { ChatMessage } from '../../../types/messages';
import styles from './UserMessage.module.css';

interface UserMessageProps {
  message: ChatMessage;
  messageIndex: number;
  tabIndex: number;
  isEditing: boolean;
  sticky?: boolean;
  onRequestEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (content: string) => void;
}

export const UserMessage = memo(function UserMessage({
  message,
  messageIndex,
  tabIndex,
  isEditing,
  sticky = false,
  onRequestEdit,
  onCancelEdit,
  onSaveEdit
}: UserMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const startEditing = useCallback(() => {
    onRequestEdit?.();
  }, [onRequestEdit]);

  const handleRestore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement restore checkpoint logic
    console.log('Restore checkpoint clicked - logic to be implemented');
  }, []);

  const handleKeydown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startEditing();
    }
  }, [startEditing]);

  // Global keyboard event for escape
  useEffect(() => {
    if (!isEditing) return;

    const handleGlobalKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelEdit?.();
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [isEditing, onCancelEdit]);

  // Click outside to cancel editing
  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (containerRef.current?.contains(target)) return;
      onCancelEdit?.();
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isEditing, onCancelEdit]);

  return (
    <div
      tabIndex={tabIndex}
      data-message-index={messageIndex}
      className={`${styles.userMessage} ${sticky ? styles.isSticky : ''}`}
    >
      <div className={styles.messageWrapper}>
        <div
          ref={containerRef}
          className={`${styles.messageContent} ${isEditing ? styles.editing : ''}`}
        >
          {/* Normal display mode */}
          {!isEditing && (
            <div
              className={styles.messageView}
              role="button"
              tabIndex={0}
              onClick={startEditing}
              onKeyDown={handleKeydown}
            >
              <div className={styles.messageText}>
                <div>{message.content}</div>
                <button
                  className={styles.restoreButton}
                  onClick={handleRestore}
                  title="恢复检查点"
                >
                  <Codicon name="restore" />
                </button>
              </div>
            </div>
          )}

          {/* Edit mode - simplified for now */}
          {isEditing && (
            <div className={styles.editMode}>
              <textarea
                className={styles.editTextarea}
                defaultValue={message.content}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const value = (e.target as HTMLTextAreaElement).value;
                    if (value.trim() && value !== message.content) {
                      onSaveEdit?.(value.trim());
                    }
                    onCancelEdit?.();
                  }
                }}
              />
              <div className={styles.editActions}>
                <button onClick={onCancelEdit}>取消</button>
                <button
                  onClick={() => {
                    const textarea = containerRef.current?.querySelector('textarea');
                    if (textarea) {
                      const value = textarea.value;
                      if (value.trim() && value !== message.content) {
                        onSaveEdit?.(value.trim());
                      }
                    }
                    onCancelEdit?.();
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default UserMessage;
