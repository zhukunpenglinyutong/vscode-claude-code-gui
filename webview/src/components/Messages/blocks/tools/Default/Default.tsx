import { memo, useMemo } from 'react';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './Default.module.css';

interface DefaultProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const Default = memo(function Default({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: DefaultProps) {
  const toolName = useMemo(() => {
    return toolUse?.name || '未知工具';
  }, [toolUse?.name]);

  // Format input as JSON
  const formattedInput = useMemo(() => {
    const input = toolUse?.input || toolUseResult?.input;
    if (!input || Object.keys(input).length === 0) return null;
    return JSON.stringify(input, null, 2);
  }, [toolUse?.input, toolUseResult?.input]);

  // Format output
  const formattedOutput = useMemo(() => {
    // Session load
    if (toolUseResult?.output) {
      return typeof toolUseResult.output === 'string'
        ? toolUseResult.output
        : JSON.stringify(toolUseResult.output, null, 2);
    }

    // Real-time conversation
    if (toolResult?.content && !toolResult.is_error) {
      const content = toolResult.content;
      if (Array.isArray(content)) {
        return content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join('\n');
      }
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return content;
        }
      }
      return JSON.stringify(content, null, 2);
    }

    return null;
  }, [toolResult, toolUseResult]);

  const shouldExpand = useMemo(() => {
    if (toolResult?.is_error) return true;
    if (formattedInput) return true;
    if (formattedOutput) return true;
    return false;
  }, [toolResult?.is_error, formattedInput, formattedOutput]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-tools"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>{toolName}</span>
        </>
      }
      expandable={
        <>
          {/* Input */}
          {formattedInput && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>输入</div>
              <pre className={styles.jsonContent}>{formattedInput}</pre>
            </div>
          )}

          {/* Output */}
          {formattedOutput && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>输出</div>
              <pre className={styles.jsonContent}>{formattedOutput}</pre>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
