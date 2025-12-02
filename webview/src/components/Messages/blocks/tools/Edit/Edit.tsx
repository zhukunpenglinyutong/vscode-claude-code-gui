import { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError, ToolFilePath } from '../common';
import styles from './Edit.module.css';

// Simple path.basename implementation
function basename(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

interface EditProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const Edit = memo(function Edit({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: EditProps) {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [structuredPatch, setStructuredPatch] = useState<any>(null);

  const filePath = useMemo(() => {
    return toolUse?.input?.file_path || toolUse?.input?.notebook_path;
  }, [toolUse?.input?.file_path, toolUse?.input?.notebook_path]);

  const fileName = useMemo(() => {
    return basename(filePath || '');
  }, [filePath]);

  const replaceAll = useMemo(() => {
    return toolUse?.input?.replace_all;
  }, [toolUse?.input?.replace_all]);

  // Generate patch from input
  const generatePatchFromInput = useCallback((oldStr: string, newStr: string): any[] => {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const lines: string[] = [];

    oldLines.forEach(line => {
      lines.push('-' + line);
    });
    newLines.forEach(line => {
      lines.push('+' + line);
    });

    return [{
      oldStart: 1,
      oldLines: oldLines.length,
      newStart: 1,
      newLines: newLines.length,
      lines
    }];
  }, []);

  // Update structuredPatch when props change
  useEffect(() => {
    if (toolResult?.is_error) {
      setStructuredPatch(null);
      return;
    }

    if (toolUseResult?.structuredPatch) {
      setStructuredPatch(toolUseResult.structuredPatch);
    } else if (toolUse?.input?.old_string && toolUse?.input?.new_string) {
      setStructuredPatch(generatePatchFromInput(
        toolUse.input.old_string,
        toolUse.input.new_string
      ));
    }
  }, [toolUseResult, toolUse, toolResult, generatePatchFromInput]);

  const hasDiffView = useMemo(() => {
    return structuredPatch && structuredPatch.length > 0;
  }, [structuredPatch]);

  const isPermissionRequest = useMemo(() => {
    const hasToolUseResult = !!toolUseResult?.structuredPatch;
    const hasInputDiff = !!(toolUse?.input?.old_string && toolUse?.input?.new_string);
    return !hasToolUseResult && hasInputDiff;
  }, [toolUseResult?.structuredPatch, toolUse?.input?.old_string, toolUse?.input?.new_string]);

  const shouldExpand = useMemo(() => {
    return hasDiffView && isPermissionRequest;
  }, [hasDiffView, isPermissionRequest]);

  const diffStats = useMemo(() => {
    if (!structuredPatch) return null;
    let added = 0;
    let removed = 0;

    structuredPatch.forEach((patch: any) => {
      patch.lines.forEach((line: string) => {
        if (line.startsWith('+')) added++;
        if (line.startsWith('-')) removed++;
      });
    });

    return { added, removed };
  }, [structuredPatch]);

  const getDiffLineClass = useCallback((line: string): string => {
    if (line.startsWith('-')) return styles.diffLineDelete;
    if (line.startsWith('+')) return styles.diffLineAdd;
    return styles.diffLineContext;
  }, []);

  const getLinePrefix = useCallback((line: string): string => {
    if (line.startsWith('-') || line.startsWith('+')) {
      return line[0];
    }
    return ' ';
  }, []);

  const getLineContent = useCallback((line: string): string => {
    if (line.startsWith('-') || line.startsWith('+')) {
      return line.substring(1);
    }
    return line;
  }, []);

  const getLineNumber = useCallback((patch: any, lineIndex: number): string => {
    const currentLine = patch.lines[lineIndex];

    if (currentLine.startsWith('-')) {
      let oldLine = patch.oldStart;
      for (let i = 0; i < lineIndex; i++) {
        if (!patch.lines[i].startsWith('+')) {
          oldLine++;
        }
      }
      return String(oldLine);
    } else {
      let newLine = patch.newStart;
      for (let i = 0; i < lineIndex; i++) {
        if (!patch.lines[i].startsWith('-')) {
          newLine++;
        }
      }
      return String(newLine);
    }
  }, []);

  const handleContentScroll = useCallback(() => {
    if (lineNumbersRef.current && contentRef.current) {
      lineNumbersRef.current.scrollTop = contentRef.current.scrollTop;
    }
  }, []);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-edit"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      className={hasDiffView ? styles.hasDiffView : ''}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Edit</span>
          {filePath && <ToolFilePath filePath={filePath} />}
          {diffStats && (
            <span className={styles.diffStats}>
              {diffStats.added > 0 && (
                <span className={styles.statAdd}>+{diffStats.added}</span>
              )}
              {diffStats.removed > 0 && (
                <span className={styles.statRemove}>-{diffStats.removed}</span>
              )}
            </span>
          )}
        </>
      }
      expandable={
        <>
          {/* Replace All Option */}
          {replaceAll && (
            <div className={styles.replaceOption}>
              <Icon name="codicon-replace-all" />
              <span>全部替换</span>
            </div>
          )}

          {/* Diff View */}
          {structuredPatch && structuredPatch.length > 0 && (
            <div className={styles.diffView}>
              {/* File Header */}
              {filePath && (
                <div className={styles.diffFileHeader}>
                  <span className={styles.fileName}>{fileName}</span>
                </div>
              )}

              <div className={styles.diffScrollContainer}>
                {/* Line Numbers */}
                <div ref={lineNumbersRef} className={styles.diffLineNumbers}>
                  {structuredPatch.map((patch: any, patchIndex: number) => (
                    <div key={patchIndex}>
                      {patch.lines.map((line: string, lineIndex: number) => (
                        <div
                          key={lineIndex}
                          className={`${styles.lineNumberItem} ${getDiffLineClass(line)}`}
                        >
                          {getLineNumber(patch, lineIndex)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Content */}
                <div
                  ref={contentRef}
                  className={styles.diffContent}
                  onScroll={handleContentScroll}
                >
                  {structuredPatch.map((patch: any, patchIndex: number) => (
                    <div key={patchIndex} className={styles.diffBlock}>
                      <div className={styles.diffLines}>
                        {patch.lines.map((line: string, lineIndex: number) => (
                          <div
                            key={lineIndex}
                            className={`${styles.diffLine} ${getDiffLineClass(line)}`}
                          >
                            <span className={styles.linePrefix}>{getLinePrefix(line)}</span>
                            <span className={styles.lineContent}>{getLineContent(line)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
