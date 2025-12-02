import { memo, useMemo } from 'react';
import { Icon } from '@/components/common';
import { parseToolError } from '@/utils/toolErrorParser';
import styles from './ToolError.module.css';

interface ToolErrorProps {
  toolResult?: any;
}

export const ToolError = memo(function ToolError({ toolResult }: ToolErrorProps) {
  const errorContent = useMemo(() => {
    return parseToolError(toolResult);
  }, [toolResult]);

  if (!errorContent) return null;

  return (
    <div className={styles.errorContent}>
      <Icon name="codicon-error" className={styles.errorIcon} />
      <span className={styles.errorText}>{errorContent}</span>
    </div>
  );
});
