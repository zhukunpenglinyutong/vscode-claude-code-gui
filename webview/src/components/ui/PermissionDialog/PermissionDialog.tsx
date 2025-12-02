import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PermissionDialog.module.css';

interface PermissionDialogProps {
  isVisible: boolean;
  toolName?: string;
  toolDescription?: string;
  onApprove: () => void;
  onDeny: () => void;
}

export const PermissionDialog = memo(function PermissionDialog({
  isVisible,
  toolName = '未知工具',
  toolDescription,
  onApprove,
  onDeny
}: PermissionDialogProps) {
  const handleApprove = useCallback(() => {
    onApprove();
  }, [onApprove]);

  const handleDeny = useCallback(() => {
    onDeny();
  }, [onDeny]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApprove();
    } else if (e.key === 'Escape') {
      handleDeny();
    }
  }, [handleApprove, handleDeny]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            className={styles.dialog}
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className={styles.header}>
              <span className={`codicon codicon-shield ${styles.shieldIcon}`}></span>
              <h3 className={styles.title}>需要权限</h3>
            </div>

            <div className={styles.content}>
              <div className={styles.toolInfo}>
                <span className={styles.toolLabel}>工具:</span>
                <span className={styles.toolName}>{toolName}</span>
              </div>

              {toolDescription && (
                <p className={styles.description}>{toolDescription}</p>
              )}

              <p className={styles.prompt}>
                是否允许此工具执行?
              </p>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.denyButton}
                onClick={handleDeny}
              >
                <span className="codicon codicon-close"></span>
                拒绝
              </button>
              <button
                className={styles.approveButton}
                onClick={handleApprove}
                autoFocus
              >
                <span className="codicon codicon-check"></span>
                同意
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default PermissionDialog;
