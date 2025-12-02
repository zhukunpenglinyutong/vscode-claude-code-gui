import { memo, useMemo } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './BashOutput.module.css';

interface BashOutputProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const BashOutput = memo(function BashOutput({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: BashOutputProps) {
  const bashId = useMemo(() => {
    return toolUse?.input?.bash_id || toolUseResult?.shellId || '';
  }, [toolUse?.input?.bash_id, toolUseResult?.shellId]);

  const filter = useMemo(() => {
    return toolUse?.input?.filter || '';
  }, [toolUse?.input?.filter]);

  const hasFilter = useMemo(() => !!filter, [filter]);

  const status = useMemo(() => {
    return toolUseResult?.status || '';
  }, [toolUseResult?.status]);

  const exitCode = useMemo(() => {
    return toolUseResult?.exitCode;
  }, [toolUseResult?.exitCode]);

  const outputContent = useMemo(() => {
    // Priority: toolUseResult (session load)
    if (toolUseResult) {
      const stdout = toolUseResult.stdout || '';
      const stderr = toolUseResult.stderr || '';

      if (stdout && stderr) {
        return `${stdout}\n\n[stderr]\n${stderr}`;
      }
      if (stdout) return stdout;
      if (stderr) return `[stderr]\n${stderr}`;
    }

    // Real-time
    if (typeof toolResult?.content === 'string') {
      const content = toolResult.content;
      const stdoutMatch = content.match(/<stdout>([\s\S]*?)<\/stdout>/);
      const stderrMatch = content.match(/<stderr>([\s\S]*?)<\/stderr>/);

      const stdout = stdoutMatch ? stdoutMatch[1].trim() : '';
      const stderr = stderrMatch ? stderrMatch[1].trim() : '';

      if (stdout && stderr) {
        return `${stdout}\n\n[stderr]\n${stderr}`;
      }
      if (stdout) return stdout;
      if (stderr) return `[stderr]\n${stderr}`;

      return content;
    }

    return '';
  }, [toolResult, toolUseResult]);

  const hasOutput = useMemo(() => {
    return !!outputContent && !toolResult?.is_error;
  }, [outputContent, toolResult?.is_error]);

  const shouldExpand = useMemo(() => {
    return hasOutput || !!toolResult?.is_error;
  }, [hasOutput, toolResult?.is_error]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-terminal-two"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>BashOutput</span>
          {bashId && <span className={styles.bashId}>Shell {bashId}</span>}
          {status === 'running' && (
            <span className={`${styles.statusBadge} ${styles.running}`}>
              <Icon name="codicon-loading codicon-modifier-spin" />
              running
            </span>
          )}
          {exitCode !== null && exitCode !== undefined && (
            <span className={`${styles.statusBadge} ${exitCode === 0 ? styles.success : styles.error}`}>
              exit {exitCode}
            </span>
          )}
          {hasFilter && (
            <span className={styles.filterBadge}>
              <Icon name="codicon-filter" />
              filtered
            </span>
          )}
        </>
      }
      expandable={
        <>
          {/* Output */}
          {hasOutput && (
            <div className={styles.bashOutput}>
              <pre className={styles.outputContent}>{outputContent}</pre>
            </div>
          )}

          {/* No Output */}
          {!hasOutput && !toolResult?.is_error && (
            <div className={styles.noOutput}>
              <Icon name="codicon-info" />
              No new output
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
