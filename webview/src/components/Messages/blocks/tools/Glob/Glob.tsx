import { memo, useMemo } from 'react';
import { ToolMessageWrapper, ToolError, ToolFilePath } from '../common';
import styles from './Glob.module.css';

interface GlobProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const Glob = memo(function Glob({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: GlobProps) {
  const pattern = useMemo(() => {
    return toolUse?.input?.pattern;
  }, [toolUse?.input?.pattern]);

  const globPath = useMemo(() => {
    return toolUse?.input?.path || '.';
  }, [toolUse?.input?.path]);

  const resultFiles = useMemo(() => {
    if (!toolResult?.content) return [];
    const content = toolResult.content;

    if (Array.isArray(content)) {
      return content;
    }

    if (typeof content === 'string') {
      return content.split('\n').filter(line => line.trim());
    }

    return [];
  }, [toolResult?.content]);

  const fileCount = useMemo(() => resultFiles.length, [resultFiles]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-search"
      toolResult={toolResult}
      permissionState={permissionState}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Glob</span>
          {pattern && <code className={styles.patternText}>{pattern}</code>}
        </>
      }
      expandable={
        <>
          {/* Search Path */}
          {globPath && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>搜索路径:</span>
              <span className={styles.detailValue}>{globPath}</span>
            </div>
          )}

          {/* Result Files */}
          {resultFiles.length > 0 && (
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <span>找到 {fileCount} 个文件:</span>
              </div>
              <div className={styles.fileList}>
                {resultFiles.map((file, index) => (
                  <ToolFilePath
                    key={index}
                    filePath={file}
                    className={styles.fileItem}
                  />
                ))}
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
