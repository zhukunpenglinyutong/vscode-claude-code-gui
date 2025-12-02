import { memo, useMemo, useState, useCallback } from 'react';
import { Icon } from '@/components/common';
import styles from './TodoWrite.module.css';

interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

interface TodoWriteProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
}

export const TodoWriteTool = memo(function TodoWriteTool({
  toolUse
}: TodoWriteProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const todos = useMemo<Todo[]>(() => {
    return toolUse?.input?.todos || [];
  }, [toolUse?.input?.todos]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const getStatusClass = useCallback((status: string): string => {
    switch (status) {
      case 'in_progress':
        return styles.inProgress;
      case 'completed':
        return styles.completed;
      case 'pending':
      default:
        return styles.pending;
    }
  }, []);

  return (
    <div className={styles.todowriteContainer}>
      <div className={styles.todoListHeader}>
        <div className={styles.todoListHeaderLeft}>
          <div className={styles.todoListHeaderLeftTitle}>
            <Icon name="codicon-checklist" className={styles.todoListHeaderLeftTitleIcon} />
            To-dos
            <span className={styles.todoCount}>{todos.length}</span>
          </div>
        </div>
        <div className={styles.todoListHeaderRight}>
          <button className={styles.expanderBtn} onClick={toggleExpand}>
            <Icon name={isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right'} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.todoListContent}>
          <ul className={styles.todoList}>
            {todos.map((todo, index) => (
              <li
                key={`todo-${index}`}
                className={`${styles.todoItem} ${getStatusClass(todo.status)}`}
              >
                <div className={styles.todoLabel}>
                  <div className={styles.todoItemIconContainer}>
                    {todo.status === 'in_progress' ? (
                      <div className={styles.todoInProgressCircle}>
                        <Icon name="codicon-arrow-small-right" />
                      </div>
                    ) : (
                      <div
                        className={`${styles.todoItemIndicator} ${todo.status === 'completed' ? styles.hasIcon : ''}`}
                      >
                        {todo.status === 'completed' && (
                          <Icon name="codicon-check" style={{ fontSize: '6px', marginLeft: '-1px' }} />
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`${styles.todoContent} ${styles[`todo${todo.status.charAt(0).toUpperCase() + todo.status.slice(1).replace('_', '')}`]}`}>
                    {todo.content}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
