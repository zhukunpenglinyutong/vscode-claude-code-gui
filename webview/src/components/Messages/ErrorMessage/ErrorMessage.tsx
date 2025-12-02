import React, { memo } from 'react';
import { Codicon } from '../../common';
import type { ChatMessage } from '../../../types/messages';
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: ChatMessage;
  messageIndex: number;
  tabIndex: number;
}

export const ErrorMessage = memo(function ErrorMessage({
  message,
  messageIndex,
  tabIndex
}: ErrorMessageProps) {
  return (
    <div
      tabIndex={tabIndex}
      data-message-index={messageIndex}
      className={styles.errorMessage}
    >
      <div className={styles.messageWrapper}>
        <Codicon name="error" className={styles.icon} />
        <span className={styles.errorText}>{message.content}</span>
      </div>
    </div>
  );
});

export default ErrorMessage;
