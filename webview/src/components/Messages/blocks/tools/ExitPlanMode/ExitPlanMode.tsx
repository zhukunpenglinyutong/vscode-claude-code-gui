import { memo, useMemo, useState, useCallback } from 'react';
import { marked } from 'marked';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './ExitPlanMode.module.css';

interface ExitPlanModeProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const ExitPlanMode = memo(function ExitPlanMode({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: ExitPlanModeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const plan = useMemo(() => {
    return toolUse?.input?.plan || toolUseResult?.plan;
  }, [toolUse?.input?.plan, toolUseResult?.plan]);

  const renderedPlan = useMemo(() => {
    if (!plan) return '';
    return marked(plan);
  }, [plan]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <ToolMessageWrapper
      toolResult={toolResult}
      permissionState={permissionState}
      isCustomLayout={true}
      onAllow={onAllow}
      onDeny={onDeny}
      custom={
        <div className={styles.planCard}>
          {/* Plan Header */}
          <div className={styles.planHeader}>
            <Icon name="codicon-tasklist" />
            <span className={styles.planTitle}>Plan</span>
          </div>

          {/* Plan Content */}
          {plan && (
            <div className={`${styles.planBody} ${isExpanded ? styles.isExpanded : ''}`}>
              <div
                className={styles.planContent}
                dangerouslySetInnerHTML={{ __html: renderedPlan }}
              />
            </div>
          )}

          {/* Expand Button */}
          {plan && !toolResult?.is_error && (
            <div className={styles.planFooter}>
              <button onClick={toggleExpand} className={styles.expandButton}>
                <Icon name={isExpanded ? 'codicon-chevron-up' : 'codicon-chevron-down'} />
                <span>{isExpanded ? '收起' : '展开'}</span>
              </button>
            </div>
          )}

          {/* Error */}
          {toolResult?.is_error && <ToolError toolResult={toolResult} />}
        </div>
      }
    />
  );
});
