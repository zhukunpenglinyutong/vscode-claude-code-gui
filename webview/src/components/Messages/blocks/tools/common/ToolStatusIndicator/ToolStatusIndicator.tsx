import { memo, useMemo } from 'react';
import styles from './ToolStatusIndicator.module.css';

type StatusState = 'success' | 'error' | 'pending';

interface ToolStatusIndicatorProps {
  state: StatusState;
  className?: string;
}

export const ToolStatusIndicator = memo(function ToolStatusIndicator({
  state,
  className = ''
}: ToolStatusIndicatorProps) {
  const statusText = useMemo(() => {
    switch (state) {
      case 'success':
        return '执行成功';
      case 'error':
        return '执行失败';
      case 'pending':
        return '等待确认';
      default:
        return '';
    }
  }, [state]);

  return (
    <div
      className={`${styles.toolStatusIndicator} ${styles[`status${state.charAt(0).toUpperCase() + state.slice(1)}`]} ${className}`}
      title={statusText}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7.5" cy="7.5" r="5" fill="currentColor" />
      </svg>
    </div>
  );
});
