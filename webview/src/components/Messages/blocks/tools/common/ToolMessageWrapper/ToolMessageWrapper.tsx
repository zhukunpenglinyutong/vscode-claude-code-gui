import { memo, useState, useCallback, useMemo, ReactNode } from 'react';
import { Icon } from '@/components/common';
import { ToolStatusIndicator } from '../ToolStatusIndicator';
import styles from './ToolMessageWrapper.module.css';

interface ToolMessageWrapperProps {
  toolIcon?: string;
  toolResult?: any;
  permissionState?: string;
  defaultExpanded?: boolean;
  isCustomLayout?: boolean;
  className?: string;
  onAllow?: () => void;
  onDeny?: () => void;
  // Slots
  main?: ReactNode;
  expandable?: ReactNode;
  custom?: ReactNode;
}

export const ToolMessageWrapper = memo(function ToolMessageWrapper({
  toolIcon,
  toolResult,
  permissionState,
  defaultExpanded = false,
  isCustomLayout = false,
  className = '',
  onAllow,
  onDeny,
  main,
  expandable,
  custom
}: ToolMessageWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [userToggled, setUserToggled] = useState(false);
  const [userToggledState, setUserToggledState] = useState(false);

  // Check if there is expandable content
  const hasExpandableContent = useMemo(() => {
    return !!expandable || !!toolResult?.is_error;
  }, [expandable, toolResult?.is_error]);

  // Computed expanded state
  const isExpanded = useMemo(() => {
    if (userToggled) {
      return userToggledState;
    }
    return defaultExpanded || !!toolResult?.is_error;
  }, [userToggled, userToggledState, defaultExpanded, toolResult?.is_error]);

  // Status indicator state
  const indicatorState = useMemo<'success' | 'error' | 'pending' | null>(() => {
    if (toolResult?.is_error) return 'error';
    if (permissionState === 'pending') return 'pending';
    if (toolResult) return 'success';
    return null;
  }, [toolResult, permissionState]);

  // Toggle expand
  const toggleExpand = useCallback(() => {
    if (hasExpandableContent) {
      setUserToggled(true);
      setUserToggledState(!isExpanded);
    }
  }, [hasExpandableContent, isExpanded]);

  // Handle allow click
  const handleAllow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAllow?.();
  }, [onAllow]);

  // Handle deny click
  const handleDeny = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeny?.();
  }, [onDeny]);

  return (
    <div className={`${styles.messageWrapper} ${className}`}>
      {/* Custom Layout Mode */}
      {isCustomLayout ? (
        custom
      ) : (
        /* Standard Layout Mode */
        <>
          {/* Main Line */}
          <div
            className={`${styles.mainLine} ${hasExpandableContent ? styles.isExpandable : ''}`}
            onClick={toggleExpand}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Tool Icon */}
            <button className={styles.toolIconBtn}>
              {(!isHovered || !hasExpandableContent) ? (
                <Icon name={toolIcon || 'codicon-tools'} />
              ) : isExpanded ? (
                <Icon name="codicon-fold" />
              ) : (
                <Icon name="codicon-chevron-up-down" />
              )}
            </button>

            {/* Main Content */}
            <div className={styles.mainContent}>
              {main}
            </div>

            {/* Status Indicator */}
            {indicatorState && (
              <ToolStatusIndicator
                state={indicatorState}
                className={styles.statusIndicatorTrailing}
              />
            )}
          </div>

          {/* Expandable Content */}
          {hasExpandableContent && isExpanded && (
            <div className={styles.expandableContent}>
              {expandable}
            </div>
          )}
        </>
      )}

      {/* Permission Actions */}
      {permissionState === 'pending' && (
        <div className={styles.permissionActions}>
          <button onClick={handleDeny} className={styles.btnReject}>
            <span>Reject ⇧⌘⊗</span>
          </button>
          <button onClick={handleAllow} className={styles.btnAccept}>
            <span>Accept ⌘↩</span>
          </button>
        </div>
      )}
    </div>
  );
});
