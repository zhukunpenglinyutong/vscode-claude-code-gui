import { memo, useMemo } from 'react';
import { ToolMessageWrapper, ToolError } from '../common';
import styles from './SlashCommand.module.css';

interface SlashCommandProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const SlashCommand = memo(function SlashCommand({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: SlashCommandProps) {
  const command = useMemo(() => {
    if (toolUse?.input?.command) {
      return toolUse.input.command;
    }
    if (toolUseResult && typeof toolUseResult === 'object' && toolUseResult.command) {
      return toolUseResult.command;
    }
    return '';
  }, [toolUse?.input?.command, toolUseResult]);

  return (
    <ToolMessageWrapper
      toolIcon="codicon-symbol-event"
      toolResult={toolResult}
      permissionState={permissionState}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <span className={styles.commandText}>{command}</span>
      }
      expandable={
        toolResult?.is_error ? (
          <ToolError toolResult={toolResult} />
        ) : undefined
      }
    />
  );
});
