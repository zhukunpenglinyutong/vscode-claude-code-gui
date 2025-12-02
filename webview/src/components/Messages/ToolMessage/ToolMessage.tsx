import { memo, useMemo, useCallback } from 'react';
import { useToolMessageStore } from '../../../store/toolMessageStore';
import {
  Default,
  Bash,
  BashOutput,
  KillShell,
  Read,
  WriteTool,
  Edit,
  Glob,
  Grep,
  WebSearch,
  WebFetch,
  TodoWriteTool,
  Task,
  ExitPlanMode,
  SlashCommand,
  McpTool,
  NotebookEdit
} from '../blocks/tools';
import styles from './ToolMessage.module.css';

interface ToolMessageProps {
  toolUseId: string;
  messageIndex: number;
  tabIndex: number;
}

// Tool name to component mapping
const toolComponentMap: Record<string, React.ComponentType<any>> = {
  Bash: Bash,
  BashOutput: BashOutput,
  KillShell: KillShell,
  Read: Read,
  Write: WriteTool,
  Edit: Edit,
  MultiEdit: Edit, // MultiEdit uses same component as Edit
  Glob: Glob,
  Grep: Grep,
  WebSearch: WebSearch,
  WebFetch: WebFetch,
  TodoWrite: TodoWriteTool,
  Task: Task,
  ExitPlanMode: ExitPlanMode,
  SlashCommand: SlashCommand,
  NotebookEdit: NotebookEdit,
};

/**
 * Tool Message Component
 * Routes to specific tool components based on tool name
 */
export const ToolMessage = memo(function ToolMessage({
  toolUseId,
  messageIndex,
  tabIndex
}: ToolMessageProps) {
  const toolMessage = useToolMessageStore((state) => state.getToolMessage(toolUseId));

  // Get the appropriate tool component
  const ToolComponent = useMemo(() => {
    if (!toolMessage?.toolUse?.name) return Default;

    const toolName = toolMessage.toolUse.name;

    // Check for MCP tools (mcp__server__tool format)
    if (toolName.startsWith('mcp__')) {
      return McpTool;
    }

    // Check for known tools
    const component = toolComponentMap[toolName];
    if (component) {
      return component;
    }

    // Default fallback
    return Default;
  }, [toolMessage?.toolUse?.name]);

  // Handle allow permission
  const handleAllow = useCallback(() => {
    // TODO: Send permission response to extension
    console.log('Allow tool:', toolUseId);
  }, [toolUseId]);

  // Handle deny permission
  const handleDeny = useCallback(() => {
    // TODO: Send permission response to extension
    console.log('Deny tool:', toolUseId);
  }, [toolUseId]);

  if (!toolMessage) {
    return null;
  }

  const { toolUse, toolResult, toolUseResult, permissionState } = toolMessage;

  return (
    <div
      tabIndex={tabIndex}
      data-message-index={messageIndex}
      className={styles.toolMessage}
    >
      <ToolComponent
        toolUse={toolUse}
        toolResult={toolResult}
        toolUseResult={toolUseResult}
        permissionState={permissionState}
        onAllow={handleAllow}
        onDeny={handleDeny}
      />
    </div>
  );
});

export default ToolMessage;
