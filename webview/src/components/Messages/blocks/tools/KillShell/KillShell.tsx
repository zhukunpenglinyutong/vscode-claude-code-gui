import { memo, useMemo } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './KillShell.module.css';

interface KillShellProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const KillShell = memo(function KillShell({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: KillShellProps) {
  const shellId = useMemo(() => {
    return toolUse?.input?.shell_id || toolUseResult?.shell_id || '';
  }, [toolUse?.input?.shell_id, toolUseResult?.shell_id]);

  const message = useMemo(() => {
    // Priority: toolUseResult (session load)
    if (toolUseResult?.message) {
      return toolUseResult.message;
    }

    // Real-time
    if (typeof toolResult?.content === 'string') {
      try {
        const data = JSON.parse(toolResult.content);
        return data.message || '';
      } catch {
        return toolResult.content;
      }
    }

    return '';
  }, [toolResult, toolUseResult]);

  const isSuccess = useMemo(() => {
    return !!message && !toolResult?.is_error;
  }, [message, toolResult?.is_error]);

  const shouldExpand = useMemo(() => {
    return !!toolResult?.is_error;
  }, [toolResult?.is_error]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-stop-circle"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>KillShell</span>
          {shellId && <span className={styles.shellId}>Shell {shellId}</span>}
          {isSuccess && (
            <span className={`${styles.statusBadge} ${styles.success}`}>
              <Icon name="codicon-check" />
              killed
            </span>
          )}
        </>
      }
      expandable={
        <>
          {/* Success Message */}
          {message && !toolResult?.is_error && (
            <div className={styles.successMessage}>
              <Icon name="codicon-info" />
              <span className={styles.messageText}>{message}</span>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
