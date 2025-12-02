import { memo, useState, useCallback } from 'react';
import styles from './MessageQueueList.module.css';

export interface QueuedMessage {
  id: string;
  content: string;
  timestamp?: Date;
}

interface MessageQueueListProps {
  queuedMessages?: QueuedMessage[];
  visible?: boolean;
  initialExpanded?: boolean;
  onRemove?: (messageId: string) => void;
  onSendNow?: (messageId: string) => void;
}

export const MessageQueueList = memo(function MessageQueueList({
  queuedMessages = [],
  visible = false,
  initialExpanded = true,
  onRemove,
  onSendNow
}: MessageQueueListProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  if (!visible || queuedMessages.length === 0) return null;

  return (
    <div className={styles.messageQueueSection}>
      {/* Message Queue header */}
      <div
        className={styles.queueHeader}
        onClick={toggleExpanded}
      >
        <div className={styles.headerContent}>
          <span
            className={`codicon ${expanded ? 'codicon-chevron-down' : 'codicon-chevron-right'} ${styles.chevronIcon}`}
          />
          <div className={styles.headerText}>
            <span>{queuedMessages.length} 队列中</span>
          </div>
        </div>
      </div>

      {/* Queue list (when expanded) */}
      {expanded && (
        <div className={styles.queueItemList}>
          {queuedMessages.map(message => (
            <div key={message.id} className={styles.queueItem}>
              {/* Queue indicator */}
              <div className={styles.queueItemIndicator}></div>

              {/* Message content */}
              <div className={styles.messageContentWrapper}>
                <div className={styles.messageContent}>
                  <div
                    className={styles.aislashEditorInputReadonly}
                    title={message.content}
                  >
                    <p><span>{message.content}</span></p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className={styles.queueItemActions}>
                {/* Delete button */}
                <div
                  className={styles.anysphereIconButton}
                  onClick={() => onRemove?.(message.id)}
                  title="从队列中移除"
                >
                  <span className="codicon codicon-trashcan"></span>
                </div>
                {/* Send now button */}
                <div
                  className={styles.anysphereIconButton}
                  onClick={() => onSendNow?.(message.id)}
                  title="立即发送(中断当前对话)"
                >
                  <span className="codicon codicon-arrow-up-two"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default MessageQueueList;
