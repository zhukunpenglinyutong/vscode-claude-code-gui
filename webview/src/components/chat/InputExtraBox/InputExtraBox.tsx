import { memo, useMemo } from 'react';
import { TodoList, TodoItem as Todo } from '../../ui/TodoList';
import { FileEditedList, FileEdit } from '../../editor/FileEditedList';
import { MessageQueueList, QueuedMessage } from '../MessageQueueList';
import styles from './InputExtraBox.module.css';

interface InputExtraBoxProps {
  todos?: Todo[];
  filesEdited?: FileEdit[];
  queuedMessages?: QueuedMessage[];
  showTodos?: boolean;
  showFiles?: boolean;
  showQueue?: boolean;
  onTodoToggle?: (index: number) => void;
  onQueueRemove?: (messageId: string) => void;
  onQueueSendNow?: (messageId: string) => void;
}

export const InputExtraBox = memo(function InputExtraBox({
  todos = [],
  filesEdited = [],
  queuedMessages = [],
  showTodos = false,
  showFiles = false,
  showQueue = false,
  onTodoToggle,
  onQueueRemove,
  onQueueSendNow
}: InputExtraBoxProps) {
  // Internal display logic: show container only when any item needs to be shown
  const shouldShow = useMemo(() => {
    const hasTodos = showTodos && todos.length > 0;
    const hasFiles = showFiles && filesEdited.length > 0;
    const hasQueue = showQueue && queuedMessages.length > 0;
    return hasTodos || hasFiles || hasQueue;
  }, [showTodos, todos.length, showFiles, filesEdited.length, showQueue, queuedMessages.length]);

  // Show divider between Todo and Queue
  const shouldShowTodoQueueDivider = useMemo(() => {
    const hasTodos = showTodos && todos.length > 0;
    const hasQueue = showQueue && queuedMessages.length > 0;
    return hasTodos && hasQueue;
  }, [showTodos, todos.length, showQueue, queuedMessages.length]);

  // Show divider between Queue and Files
  const shouldShowQueueFilesDivider = useMemo(() => {
    const hasQueue = showQueue && queuedMessages.length > 0;
    const hasFiles = showFiles && filesEdited.length > 0;
    return hasQueue && hasFiles;
  }, [showQueue, queuedMessages.length, showFiles, filesEdited.length]);

  if (!shouldShow) return null;

  return (
    <div className={styles.inputExtraBox}>
      <div className={styles.toolbarSection}>
        <TodoList
          todos={todos}
          visible={showTodos}
          onTodoToggle={onTodoToggle}
        />

        {/* Divider between Todo and Queue */}
        {shouldShowTodoQueueDivider && (
          <div className={styles.divider} />
        )}

        <MessageQueueList
          queuedMessages={queuedMessages}
          visible={showQueue}
          onRemove={onQueueRemove}
          onSendNow={onQueueSendNow}
        />

        {/* Divider between Queue and Files */}
        {shouldShowQueueFilesDivider && (
          <div className={styles.divider} />
        )}

        <FileEditedList
          filesEdited={filesEdited}
          visible={showFiles}
        />
      </div>
    </div>
  );
});

export default InputExtraBox;
