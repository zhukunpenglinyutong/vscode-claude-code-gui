import { memo, useState, useCallback } from 'react';
import styles from './TodoList.module.css';

export interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TodoListProps {
  todos?: Todo[];
  visible?: boolean;
  initialExpanded?: boolean;
  onTodoToggle?: (index: number) => void;
}

export const TodoList = memo(function TodoList({
  todos = [],
  visible = false,
  initialExpanded = true,
  onTodoToggle
}: TodoListProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const toggleTodo = useCallback((index: number) => {
    onTodoToggle?.(index);
  }, [onTodoToggle]);

  if (!visible) return null;

  return (
    <div className={styles.todoListSection}>
      {/* Todo header */}
      <div
        className={styles.todoHeader}
        onClick={toggleExpanded}
      >
        <div className={styles.todoHeaderContent}>
          <span
            className={`codicon ${expanded ? 'codicon-chevron-down' : 'codicon-chevron-right'} ${styles.chevronIcon}`}
          />
          <div className={styles.todoCount}>
            {todos.length} To-dos
          </div>
        </div>
      </div>

      {/* Todo list */}
      {expanded && todos.length > 0 && (
        <div className={styles.todoListContainer}>
          <div className={`${styles.customScrollbar} ${styles.todoScrollArea}`}>
            <ul className={`${styles.todoList} ${styles.fadeInFast}`}>
              {todos.map((todo, index) => (
                <li
                  key={index}
                  className={`${styles.todoItem} ${styles.fadeInTodo} ${styles[todo.status]}`}
                  onClick={() => toggleTodo(index)}
                >
                  <div className={styles.todoItemIconContainer}>
                    {todo.status === 'in_progress' ? (
                      <div className={styles.todoInProgressCircle}>
                        <span className="codicon codicon-arrow-small-right" />
                      </div>
                    ) : (
                      <div
                        className={`${styles.todoItemIndicator} ${todo.status === 'completed' ? styles.hasIcon : ''}`}
                      >
                        {todo.status === 'completed' && (
                          <div
                            className="codicon codicon-check-two"
                            style={{ fontSize: '6px', marginLeft: '-1px' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.todoItemContent}>
                    <span
                      className={`${styles.todoItemText} ${todo.status === 'in_progress' ? styles.todoInProgress : ''}`}
                    >
                      {todo.content}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
});

export default TodoList;
