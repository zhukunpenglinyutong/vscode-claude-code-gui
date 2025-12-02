import { memo, useMemo } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError, ToolFilePath } from '../common';
import styles from './Grep.module.css';

interface GrepProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const Grep = memo(function Grep({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: GrepProps) {
  const pattern = useMemo(() => toolUse?.input?.pattern, [toolUse?.input?.pattern]);
  const searchPath = useMemo(() => toolUse?.input?.path, [toolUse?.input?.path]);
  const glob = useMemo(() => toolUse?.input?.glob, [toolUse?.input?.glob]);
  const fileType = useMemo(() => toolUse?.input?.type, [toolUse?.input?.type]);
  const outputMode = useMemo(() => toolUse?.input?.output_mode, [toolUse?.input?.output_mode]);

  const caseInsensitive = useMemo(() => toolUse?.input?.['-i'], [toolUse?.input]);
  const multiline = useMemo(() => toolUse?.input?.multiline, [toolUse?.input?.multiline]);
  const showLineNumbers = useMemo(() => toolUse?.input?.['-n'], [toolUse?.input]);
  const contextLines = useMemo(() => {
    return toolUse?.input?.['-A'] || toolUse?.input?.['-B'] || toolUse?.input?.['-C'];
  }, [toolUse?.input]);
  const headLimit = useMemo(() => toolUse?.input?.head_limit, [toolUse?.input?.head_limit]);

  const hasSearchOptions = useMemo(() => {
    return searchPath || glob || fileType || outputMode;
  }, [searchPath, glob, fileType, outputMode]);

  const hasFlags = useMemo(() => {
    return caseInsensitive || multiline || showLineNumbers || contextLines || headLimit;
  }, [caseInsensitive, multiline, showLineNumbers, contextLines, headLimit]);

  const resultFiles = useMemo(() => {
    if (!toolResult?.content) return [];
    const content = toolResult.content;

    if (typeof content === 'string') {
      const lines = content.split('\n').filter(line => line.trim());
      return lines.filter(line => !line.match(/^Found \d+ files?$/i));
    }

    return [];
  }, [toolResult?.content]);

  const fileCount = useMemo(() => resultFiles.length, [resultFiles]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-grep"
      toolResult={toolResult}
      permissionState={permissionState}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Grep</span>
          {pattern && <code className={styles.patternText}>{pattern}</code>}
        </>
      }
      expandable={
        <>
          {/* Search Options */}
          {hasSearchOptions && (
            <div className={styles.optionsSection}>
              <div className={styles.optionsGrid}>
                {searchPath && (
                  <div className={styles.optionItem}>
                    <Icon name="codicon-folder" />
                    <span className={styles.optionText}>路径: {searchPath}</span>
                  </div>
                )}
                {glob && (
                  <div className={styles.optionItem}>
                    <Icon name="codicon-filter" />
                    <span className={styles.optionText}>过滤: {glob}</span>
                  </div>
                )}
                {fileType && (
                  <div className={styles.optionItem}>
                    <Icon name="codicon-file-code" />
                    <span className={styles.optionText}>类型: {fileType}</span>
                  </div>
                )}
                {outputMode && (
                  <div className={styles.optionItem}>
                    <Icon name="codicon-output" />
                    <span className={styles.optionText}>模式: {outputMode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flags */}
          {hasFlags && (
            <div className={styles.flagsSection}>
              <div className={styles.detailLabel}>标志:</div>
              <div className={styles.flagsList}>
                {caseInsensitive && (
                  <span className={styles.flagTag}>
                    <Icon name="codicon-case-sensitive" />
                    忽略大小写
                  </span>
                )}
                {multiline && (
                  <span className={styles.flagTag}>
                    <Icon name="codicon-whole-word" />
                    多行模式
                  </span>
                )}
                {showLineNumbers && (
                  <span className={styles.flagTag}>
                    <Icon name="codicon-list-ordered" />
                    显示行号
                  </span>
                )}
                {contextLines && (
                  <span className={styles.flagTag}>
                    <Icon name="codicon-list-tree" />
                    上下文: {contextLines} 行
                  </span>
                )}
                {headLimit && (
                  <span className={styles.flagTag}>
                    <Icon name="codicon-arrow-up" />
                    限制: {headLimit} 条
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {resultFiles.length > 0 && (
            <div className={styles.resultsSection}>
              <div className={styles.detailLabel}>
                <span>找到 {fileCount} 个文件:</span>
              </div>
              <div className={styles.fileList}>
                {resultFiles.map((file, index) => (
                  <ToolFilePath key={index} filePath={file} />
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
