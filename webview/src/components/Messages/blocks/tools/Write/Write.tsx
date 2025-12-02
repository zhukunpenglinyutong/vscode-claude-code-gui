import { memo, useMemo, useRef, useCallback } from 'react';
import { ToolMessageWrapper, ToolError, ToolFilePath } from '../common';
import styles from './Write.module.css';

// Simple path.basename implementation
function basename(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

interface WriteProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const WriteTool = memo(function WriteTool({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: WriteProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const filePath = useMemo(() => {
    return toolUse?.input?.file_path || toolUseResult?.file_path;
  }, [toolUse?.input?.file_path, toolUseResult?.file_path]);

  const fileName = useMemo(() => {
    return basename(filePath || '');
  }, [filePath]);

  const content = useMemo(() => {
    // Priority: toolUseResult (session load)
    if (toolUseResult?.content) {
      return toolUseResult.content;
    }
    // Real-time
    if (toolUse?.input?.content) {
      return toolUse.input.content;
    }
    return '';
  }, [toolUse?.input?.content, toolUseResult?.content]);

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
      toolIcon="codicon-new-file"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      className={hasContentView ? styles.hasContentView : ''}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Write</span>
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
            <div className={styles.writeView}>
              {/* File Header */}
              {filePath && (
                <div className={styles.writeFileHeader}>
                  <span className={styles.fileName}>{fileName}</span>
                </div>
              )}

              <div className={styles.writeScrollContainer}>
                {/* Line Numbers */}
                <div ref={lineNumbersRef} className={styles.writeLineNumbers}>
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className={styles.lineNumberItem}>
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div
                  ref={contentRef}
                  className={styles.writeContent}
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
