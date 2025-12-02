import { memo, useMemo } from 'react';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './WebFetch.module.css';

interface WebFetchProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const WebFetch = memo(function WebFetch({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: WebFetchProps) {
  const url = useMemo(() => {
    return toolUse?.input?.url || toolUseResult?.url;
  }, [toolUse?.input?.url, toolUseResult?.url]);

  const prompt = useMemo(() => {
    return toolUse?.input?.prompt || toolUseResult?.prompt;
  }, [toolUse?.input?.prompt, toolUseResult?.prompt]);

  const result = useMemo(() => {
    // Session load
    if (toolUseResult?.result) {
      return toolUseResult.result;
    }

    // Real-time
    if (toolResult?.content) {
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

  const statusCode = useMemo(() => {
    return toolUseResult?.code;
  }, [toolUseResult?.code]);

  const codeText = useMemo(() => {
    return toolUseResult?.codeText;
  }, [toolUseResult?.codeText]);

  const durationMs = useMemo(() => {
    return toolUseResult?.durationMs;
  }, [toolUseResult?.durationMs]);

  const statusClass = useMemo(() => {
    if (!statusCode) return '';
    const code = statusCode;
    if (code >= 200 && code < 300) return styles.statusSuccess;
    if (code >= 300 && code < 400) return styles.statusRedirect;
    if (code >= 400 && code < 500) return styles.statusClientError;
    if (code >= 500) return styles.statusServerError;
    return '';
  }, [statusCode]);

  const displayUrl = useMemo(() => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname;

      if (pathname.length > 30) {
        return `${hostname}${pathname.substring(0, 27)}...`;
      }

      return `${hostname}${pathname}`;
    } catch {
      return url.length > 50 ? url.substring(0, 47) + '...' : url;
    }
  }, [url]);

  const isPermissionRequest = useMemo(() => {
    const hasToolUseResult = !!toolUseResult;
    const hasToolResult = !!toolResult && !toolResult.is_error;
    return !hasToolUseResult && !hasToolResult;
  }, [toolUseResult, toolResult]);

  const shouldExpand = useMemo(() => {
    if (isPermissionRequest && prompt) return true;
    if (toolResult?.is_error) return true;
    if (result) return true;
    return false;
  }, [isPermissionRequest, prompt, toolResult?.is_error, result]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-globe"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Fetch</span>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.urlLink}
              onClick={(e) => e.stopPropagation()}
            >
              {displayUrl}
            </a>
          )}
          {statusCode && (
            <span className={`${styles.statusBadge} ${statusClass}`}>
              {statusCode} {codeText}
            </span>
          )}
          {durationMs && (
            <span className={styles.durationBadge}>{durationMs}ms</span>
          )}
        </>
      }
      expandable={
        <>
          {/* Prompt */}
          {prompt && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Prompt</div>
              <div className={styles.sectionValue}>{prompt}</div>
            </div>
          )}

          {/* Response Result */}
          {result && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Response</div>
              <pre className={styles.resultContent}>{result}</pre>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
