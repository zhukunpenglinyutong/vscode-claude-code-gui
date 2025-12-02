import { memo, useMemo } from 'react';
import { ToolMessageWrapper, ToolError, ToolFilePath } from '../common';
import styles from './NotebookEdit.module.css';

interface NotebookEditProps {
  toolUse?: any;
  toolResult?: any;
  toolUseResult?: any;
  permissionState?: string;
  onAllow?: () => void;
  onDeny?: () => void;
}

export const NotebookEdit = memo(function NotebookEdit({
  toolUse,
  toolResult,
  toolUseResult,
  permissionState,
  onAllow,
  onDeny
}: NotebookEditProps) {
  const notebookPath = useMemo(() => {
    return toolUse?.input?.notebook_path || toolUseResult?.notebook_path;
  }, [toolUse?.input?.notebook_path, toolUseResult?.notebook_path]);

  const cellId = useMemo(() => {
    return toolUse?.input?.cell_id || toolUseResult?.cell_id;
  }, [toolUse?.input?.cell_id, toolUseResult?.cell_id]);

  const editMode = useMemo(() => {
    return toolUse?.input?.edit_mode || toolUseResult?.edit_mode;
  }, [toolUse?.input?.edit_mode, toolUseResult?.edit_mode]);

  const newSource = useMemo(() => {
    return toolUse?.input?.new_source || toolUseResult?.new_source;
  }, [toolUse?.input?.new_source, toolUseResult?.new_source]);

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

  const getModeClass = (mode: string) => {
    switch (mode) {
      case 'replace':
        return styles.modeReplace;
      case 'insert':
        return styles.modeInsert;
      case 'delete':
        return styles.modeDelete;
      default:
        return '';
    }
  };

  return (
    <ToolMessageWrapper
      toolIcon="codicon-notebook"
      toolResult={toolResult}
      permissionState={permissionState}
      defaultExpanded={shouldExpand}
      onAllow={onAllow}
      onDeny={onDeny}
      main={
        <>
          <span className={styles.toolLabel}>NotebookEdit</span>
          {notebookPath && <ToolFilePath filePath={notebookPath} />}
          {editMode && (
            <span className={`${styles.modeBadge} ${getModeClass(editMode)}`}>
              {editMode}
            </span>
          )}
        </>
      }
      expandable={
        <>
          {/* Cell ID */}
          {cellId && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>cell_id:</span>
              <span className={styles.infoValue}>{cellId}</span>
            </div>
          )}

          {/* New Source */}
          {newSource && (
            <div className={styles.sourceSection}>
              <div className={styles.sectionLabel}>new_source</div>
              <pre className={styles.sourceContent}>{newSource}</pre>
            </div>
          )}

          {/* Error */}
          <ToolError toolResult={toolResult} />
        </>
      }
    />
  );
});
