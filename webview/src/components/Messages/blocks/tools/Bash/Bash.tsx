import { memo, useMemo, useRef, useCallback } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './Bash.module.css';

interface BashProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const Bash = memo(function Bash({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: BashProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const command = useMemo(() => {
    return toolUse?.input?.command || toolUseResult?.command || '';
  }, [toolUse?.input?.command, toolUseResult?.command]);

  const description = useMemo(() => {
    return toolUse?.input?.description;
  }, [toolUse?.input?.description]);

  const timeout = useMemo(() => {
    return toolUse?.input?.timeout;
  }, [toolUse?.input?.timeout]);

  const runInBackground = useMemo(() => {
    return toolUse?.input?.run_in_background;
  }, [toolUse?.input?.run_in_background]);

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

    // Real-time: from toolResult.content
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

  const commandLines = useMemo(() => {
    if (!command) return [];
    return command.split('\n');
  }, [command]);

  const hasOutput = useMemo(() => {
    return !!outputContent && !toolResult?.is_error;
  }, [outputContent, toolResult?.is_error]);

  const shouldExpand = useMemo(() => {
    if (permissionState === 'pending') return true;
    if (toolResult?.is_error) return true;
    if (hasOutput) return true;
    return false;
  }, [permissionState, toolResult?.is_error, hasOutput]);

  const handleContentScroll = useCallback(() => {
    if (lineNumbersRef.current && contentRef.current) {
      lineNumbersRef.current.scrollTop = contentRef.current.scrollTop;
    }
  }, []);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-terminal"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      className={hasOutput ? styles.hasOutputView : ''}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Bash</span>
          {description && (
            <span className={styles.descriptionText}>{description}</span>
          )}
          {exitCode !== null && exitCode !== undefined && (
            <span className={`${styles.statusBadge} ${exitCode === 0 ? styles.success : styles.error}`}>
              exit {exitCode}
            </span>
          )}
          {timeout && (
            <span className={styles.timeoutBadge}>
              <Icon name="codicon-clock" />
              {Math.round(timeout / 1000)}s
            </span>
          )}
          {runInBackground && (
            <span className={styles.backgroundBadge}>
              <Icon name="codicon-sync" />
              background
            </span>
          )}
        </>
      }
      expandable={
        <>
          {/* Command Display */}
          {command && (
            <div className={styles.commandView}>
              <div className={styles.commandScrollContainer}>
                {/* Line Numbers */}
                <div ref={lineNumbersRef} className={styles.commandLineNumbers}>
                  {commandLines.map((_: string, index: number) => (
                    <div key={index} className={styles.lineNumberItem}>
                      {index + 1}
                    </div>
                  ))}
                </div>

                {/* Command Content */}
                <div
                  ref={contentRef}
                  className={styles.commandContent}
                  onScroll={handleContentScroll}
                >
                  <pre className={styles.commandText}>{command}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Output */}
          {hasOutput && (
            <div className={styles.outputView}>
              <pre className={styles.outputContent}>{outputContent}</pre>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
