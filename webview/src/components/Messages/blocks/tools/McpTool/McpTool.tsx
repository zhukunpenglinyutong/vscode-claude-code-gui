import { memo, useMemo } from 'react';
import { Icon } from '@/components/common';
import { ToolMessageWrapper } from '../common';
import styles from './McpTool.module.css';

interface McpToolProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const McpTool = memo(function McpTool({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: McpToolProps) {
  const mcpParts = useMemo(() => {
    const name = toolUse?.name || '';
    const parts = name.split('__');

    if (parts.length >= 3 && parts[0] === 'mcp') {
      return {
        server: parts[1],
        tool: parts.slice(2).join('__')
      };
    }

    return {
      server: 'unknown',
      tool: name
    };
  }, [toolUse?.name]);

  const serverName = mcpParts.server;
  const toolName = mcpParts.tool;

  const hasInput = useMemo(() => {
    const input = toolUse?.input || toolUseResult?.input;
    return input && Object.keys(input).length > 0;
  }, [toolUse?.input, toolUseResult?.input]);

  const formattedInput = useMemo(() => {
    const input = toolUse?.input || toolUseResult?.input;
    return JSON.stringify(input, null, 2);
  }, [toolUse?.input, toolUseResult?.input]);

  const hasOutput = useMemo(() => {
    if (toolResult?.is_error) return false;
    if (toolUseResult?.output) return true;
    if (toolResult?.content) return true;
    return false;
  }, [toolResult, toolUseResult]);

  const formattedOutput = useMemo(() => {
    // Session load
    if (toolUseResult?.output) {
      return typeof toolUseResult.output === 'string'
        ? toolUseResult.output
        : JSON.stringify(toolUseResult.output, null, 2);
    }

    // Real-time
    if (toolResult?.content) {
      const content = toolResult.content;

      if (Array.isArray(content)) {
        const textContent = content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join('\n');

        try {
          const parsed = JSON.parse(textContent);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return textContent;
        }
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

    return '';
  }, [toolResult, toolUseResult]);

  const errorMessage = useMemo(() => {
    if (!toolResult?.is_error) return '';

    const content = toolResult.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('\n');
    }

    return JSON.stringify(content, null, 2);
  }, [toolResult]);

  const shouldExpand = useMemo(() => {
    if (toolResult?.is_error) return true;
    if (hasOutput) return true;
    return false;
  }, [toolResult?.is_error, hasOutput]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-plug"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.mcpLabel}>MCP</span>
          <span className={styles.serverBadge}>{serverName}</span>
          <span className={styles.toolName}>{toolName}</span>
        </>
      }
      expandable={
        <>
          {/* Input */}
          {hasInput && (
            <div className={styles.mcpSection}>
              <div className={styles.sectionHeader}>
                <Icon name="codicon-symbol-parameter" />
                <span>Input</span>
              </div>
              <pre className={styles.jsonContent}>{formattedInput}</pre>
            </div>
          )}

          {/* Output */}
          {hasOutput && (
            <div className={styles.mcpSection}>
              <div className={styles.sectionHeader}>
                <Icon name="codicon-output" />
                <span>Output</span>
              </div>
              <pre className={styles.jsonContent}>{formattedOutput}</pre>
            </div>
          )}

          {/* Error */}
          {toolResult?.is_error && (
            <div className={styles.errorSection}>
              <div className={styles.sectionHeader}>
                <Icon name="codicon-error" />
                <span>错误</span>
              </div>
              <pre className={styles.errorContent}>{errorMessage}</pre>
            </div>
          )}
        </>
      }
    />
  );
});
