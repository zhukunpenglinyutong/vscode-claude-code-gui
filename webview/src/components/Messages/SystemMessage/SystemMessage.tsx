import React, { memo, useMemo } from 'react';
import { Codicon } from '../../common';
import type { ChatMessage } from '../../../types/messages';
import { isSDKSystemMessage, isSDKCompactBoundaryMessage } from '../../../utils/messageUtils';
import styles from './SystemMessage.module.css';

interface SystemMessageProps {
  message: ChatMessage;
  messageIndex: number;
  tabIndex: number;
}

export const SystemMessage = memo(function SystemMessage({
  message,
  messageIndex,
  tabIndex
}: SystemMessageProps) {
  const messageType = useMemo(() => {
    if (!message.sdkMessage) {
      return '';
    }

    if (isSDKSystemMessage(message.sdkMessage)) {
      return '初始化';
    }

    if (isSDKCompactBoundaryMessage(message.sdkMessage)) {
      return '压缩边界';
    }

    return '';
  }, [message.sdkMessage]);

  return (
    <div
      tabIndex={tabIndex}
      data-message-index={messageIndex}
      className={styles.systemMessage}
    >
      <div className={styles.messageWrapper}>
        <Codicon name="info" className={styles.icon} />
        {messageType && (
          <span className={styles.messageType}>{messageType}</span>
        )}
        <span className={styles.systemContent}>{message.content}</span>
      </div>
    </div>
  );
});

export default SystemMessage;
