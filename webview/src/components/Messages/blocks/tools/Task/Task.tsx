import { memo, useMemo } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './Task.module.css';

interface TaskProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const Task = memo(function Task({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: TaskProps) {
  const subagentType = useMemo(() => {
    return toolUse?.input?.subagent_type || toolUseResult?.subagent_type;
  }, [toolUse?.input?.subagent_type, toolUseResult?.subagent_type]);

  const description = useMemo(() => {
    return toolUse?.input?.description || toolUseResult?.description;
  }, [toolUse?.input?.description, toolUseResult?.description]);

  const prompt = useMemo(() => {
    return toolUse?.input?.prompt || toolUseResult?.prompt;
  }, [toolUse?.input?.prompt, toolUseResult?.prompt]);

  const isPermissionRequest = useMemo(() => {
    const hasToolUseResult = !!toolUseResult;
    const hasToolResult = !!toolResult && !toolResult.is_error;
    return !hasToolUseResult && !hasToolResult;
  }, [toolUseResult, toolResult]);

  const shouldExpand = useMemo(() => {
    if (isPermissionRequest) return true;
    if (toolResult?.is_error) return true;
    return false;
  }, [isPermissionRequest, toolResult?.is_error]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-tasklist"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>Task</span>
          {subagentType && (
            <span className={styles.agentBadge}>{subagentType}</span>
          )}
          {description && (
            <span className={styles.descriptionText}>{description}</span>
          )}
        </>
      }
      expandable={
        <>
          {/* Prompt Content */}
          {prompt && (
            <div className={styles.promptSection}>
              <div className={styles.sectionHeader}>
                <Icon name="codicon-comment-discussion" />
                <span>Prompt</span>
              </div>
              <pre className={styles.promptContent}>{prompt}</pre>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
