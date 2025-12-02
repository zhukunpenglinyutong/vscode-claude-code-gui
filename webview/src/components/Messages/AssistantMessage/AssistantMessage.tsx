import React, { memo, useMemo } from 'react';
import { TextBlock } from '../blocks';
import { useToolMessageStore } from '../../../store/toolMessageStore';
import type { ChatMessage } from '../../../types/messages';
import styles from './AssistantMessage.module.css';

interface AssistantMessageProps {
  message: ChatMessage;
  messageIndex: number;
  tabIndex: number;
  streaming?: boolean;
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  messageIndex,
  tabIndex,
  streaming = false
}: AssistantMessageProps) {
  const setToolUse = useToolMessageStore((state) => state.setToolUse);

  // Filter only text blocks, tool_use blocks are handled by messageBus
  const textBlocks = useMemo(() => {
    if (message.contentBlocks && message.contentBlocks.length > 0) {
      // Process tool_use blocks to ensure they're stored
      message.contentBlocks.forEach(block => {
        if (block.type === 'tool_use' && block.id && block.name && block.input) {
          setToolUse({
            id: block.id,
            name: block.name,
            input: block.input
          });
        }
      });

      // Return only text type blocks
      return message.contentBlocks.filter(block => block.type === 'text');
    }

    return [];
  }, [message.contentBlocks, setToolUse]);

  const isLastBlock = (index: number): boolean => {
    return index === textBlocks.length - 1;
  };

  return (
    <div
      tabIndex={tabIndex}
      data-message-index={messageIndex}
      className={styles.assistantMessage}
    >
      <div className={styles.messageWrapper}>
        <div className={styles.messageHeader}>
          {/* <span className={styles.roleLabel}>Claude</span> */}
        </div>

        <div className={styles.messageContent}>
          {textBlocks.map((block, index) => (
            <TextBlock
              key={index}
              block={block}
              streaming={streaming && isLastBlock(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default AssistantMessage;
