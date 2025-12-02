import { memo, useMemo, useRef, useCallback } from 'react';
import { ToolMessageWrapper, ToolError, ToolFilePath } from '../common';
import styles from './Read.module.css';

interface ReadProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const Read = memo(function Read({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: ReadProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const filePath = useMemo(() => {
    return toolUse?.input?.file_path || toolUseResult?.file_path;
  }, [toolUse?.input?.file_path, toolUseResult?.file_path]);

  const content = useMemo(() => {
    // Priority: toolUseResult (session load)
    if (toolUseResult?.content) {
      return toolUseResult.content;
    }

    // Real-time
    if (toolResult?.content && !toolResult.is_error) {
      if (typeof toolResult.content === 'string') {
        return toolResult.content;
      }
      if (Array.isArray(toolResult.content)) {
        return toolResult.content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join('\n');
      }
    }

    return '';
  }, [toolResult, toolUseResult]);

  const contentStats = useMemo(() => {
    if (!content) return null;
    const lines = content.split('\n').length;
    const chars = content.length;
    return { lines, chars };
  }, [content]);

  const lineCount = useMemo(() => {
    if (!content) return 0;
    return content.split('\n').length;
  }, [content]);

  const hasContentView = useMemo(() => {
    return content && !toolResult?.is_error;
  }, [content, toolResult?.is_error]);

  const shouldExpand = useMemo(() => {
    if (permissionState === 'pending') return true;
    if (toolResult?.is_error) return true;
    return false;
  }, [permissionState, toolResult?.is_error]);

  const handleContentScroll = useCallback(() => {
    if (lineNumbersRef.current && contentRef.current) {
      lineNumbersRef.current.scrollTop = contentRef.current.scrollTop;
    }
  }, []);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-file"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      className={hasContentView ? styles.hasContentView : ''}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Read</span>
          {filePath && <ToolFilePath filePath={filePath} />}
          {contentStats && (
            <span className={styles.contentStats}>
              <span className={styles.statLines}>{contentStats.lines} Lines</span>
              <span className={styles.statChars}>{contentStats.chars} Chars</span>
            </span>
          )}
        </>
      }
      expandable={
        <>
          {/* File Content View */}
          {hasContentView && (
            <div className={styles.readView}>
              <div className={styles.readScrollContainer}>
                {/* Line Numbers */}
                <div ref={lineNumbersRef} className={styles.readLineNumbers}>
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className={styles.lineNumberItem}>
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div
                  ref={contentRef}
                  className={styles.readContent}
                  onScroll={handleContentScroll}
                >
                  <pre className={styles.contentText}>{content}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
