import { memo, useMemo } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './WebSearch.module.css';

interface WebSearchProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const WebSearch = memo(function WebSearch({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: WebSearchProps) {
  const query = useMemo(() => {
    return toolUse?.input?.query;
  }, [toolUse?.input?.query]);

  const allowedDomains = useMemo(() => {
    return toolUse?.input?.allowed_domains;
  }, [toolUse?.input?.allowed_domains]);

  const blockedDomains = useMemo(() => {
    return toolUse?.input?.blocked_domains;
  }, [toolUse?.input?.blocked_domains]);

  const hasExpandableContent = useMemo(() => {
    if (toolResult?.is_error) return true;
    const hasFilters = (allowedDomains && allowedDomains.length > 0) ||
                       (blockedDomains && blockedDomains.length > 0);
    return hasFilters;
  }, [toolResult?.is_error, allowedDomains, blockedDomains]);

  const isPermissionRequest = useMemo(() => {
    const hasToolUseResult = !!toolUseResult;
    const hasToolResult = !!toolResult && !toolResult.is_error;
    return !hasToolUseResult && !hasToolResult;
  }, [toolUseResult, toolResult]);

  const shouldExpand = useMemo(() => {
    return hasExpandableContent && isPermissionRequest;
  }, [hasExpandableContent, isPermissionRequest]);

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
          <span className={styles.toolLabel}>Search</span>
          {query && <span className={styles.queryText}>{query}</span>}
        </>
      }
      expandable={hasExpandableContent ? (
        <>
          {/* Allowed Domains */}
          {allowedDomains && allowedDomains.length > 0 && (
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <Icon name="codicon-verified" />
                <span>允许域名:</span>
              </div>
              <div className={styles.domainList}>
                {allowedDomains.map((domain: string) => (
                  <span key={domain} className={`${styles.domainTag} ${styles.allowed}`}>
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Blocked Domains */}
          {blockedDomains && blockedDomains.length > 0 && (
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>
                <Icon name="codicon-error" />
                <span>屏蔽域名:</span>
              </div>
              <div className={styles.domainList}>
                {blockedDomains.map((domain: string) => (
                  <span key={domain} className={`${styles.domainTag} ${styles.blocked}`}>
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      ) : undefined}
    />
  );
});
