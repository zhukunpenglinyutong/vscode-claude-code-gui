import { memo, useMemo, useCallback } from 'react';
import styles from './ToolFilePath.module.css';

interface ToolFilePathProps {
  filePath: string;
  className?: string;
}

// Simple path.basename implementation for browser
function basename(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

export const ToolFilePath = memo(function ToolFilePath({
  filePath,
  className = ''
}: ToolFilePathProps) {
  const fileName = useMemo(() => {
    return basename(filePath);
  }, [filePath]);

  const handleClick = useCallback(() => {
    // Copy path to clipboard or open file
    // TODO: Send message to extension to open file
    console.log('Open file:', filePath);
  }, [filePath]);

  return (
    <button
      className={`${styles.toolFilepath} ${className}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      title={filePath}
    >
      <span className={styles.filepathName}>{fileName}</span>
    </button>
  );
});
