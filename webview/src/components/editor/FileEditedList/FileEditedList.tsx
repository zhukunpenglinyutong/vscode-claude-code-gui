import { memo, useState, useCallback, useMemo } from 'react';
import styles from './FileEditedList.module.css';

export interface FileEdit {
  name: string;
  additions?: number;
  deletions?: number;
}

interface FileEditedListProps {
  filesEdited?: FileEdit[];
  visible?: boolean;
  initialExpanded?: boolean;
}

export const FileEditedList = memo(function FileEditedList({
  filesEdited = [],
  visible = false,
  initialExpanded = false
}: FileEditedListProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const totalAdditions = useMemo(() => {
    return filesEdited.reduce((sum, file) => sum + (file.additions || 0), 0);
  }, [filesEdited]);

  const totalDeletions = useMemo(() => {
    return filesEdited.reduce((sum, file) => sum + (file.deletions || 0), 0);
  }, [filesEdited]);

  if (!visible || filesEdited.length === 0) return null;

  return (
    <div className={styles.fileEditedSection}>
      {/* Files Edited header */}
      <div
        className={styles.fileEditedHeader}
        onClick={toggleExpanded}
      >
        <div className={styles.headerContent}>
          <span
            className={`codicon ${expanded ? 'codicon-chevron-down' : 'codicon-chevron-right'} ${styles.chevronIcon}`}
          />
          <div className={styles.headerText}>
            <span>{filesEdited.length} Files Edited</span>
            <span className={styles.diffStats}>
              <span className={styles.additions}>+{totalAdditions}</span>
              <span className={styles.deletions}>-{totalDeletions}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Files list (when expanded) */}
      {expanded && (
        <div className={styles.fileList}>
          {filesEdited.map((file, index) => (
            <div key={index} className={styles.fileItem}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileDiff}>
                <span className={styles.additions}>+{file.additions || 0}</span>
                <span className={styles.deletions}>-{file.deletions || 0}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default FileEditedList;
