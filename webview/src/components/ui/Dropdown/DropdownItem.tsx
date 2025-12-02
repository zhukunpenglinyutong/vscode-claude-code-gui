import { memo, useMemo, ReactNode } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownItemData {
  id: string;
  label?: string;
  name?: string;
  detail?: string;
  icon?: string;
  rightIcon?: string;
  checked?: boolean;
  disabled?: boolean;
  type?: string;
  data?: any;
  [key: string]: any;
}

interface DropdownItemProps {
  item: DropdownItemData;
  isSelected?: boolean;
  index: number;
  onClick?: (item: DropdownItemData) => void;
  onMouseEnter?: (index: number) => void;
  iconSlot?: ReactNode | ((item: DropdownItemData) => ReactNode);
}

export const DropdownItem = memo(function DropdownItem({
  item,
  isSelected = false,
  index,
  onClick,
  onMouseEnter,
  iconSlot
}: DropdownItemProps) {
  // Check if has icon
  const hasIcon = useMemo(() => {
    return !!item.icon || !!iconSlot;
  }, [item.icon, iconSlot]);

  const handleClick = () => {
    if (!item.disabled) {
      onClick?.(item);
    }
  };

  const handleMouseEnter = () => {
    if (!item.disabled) {
      onMouseEnter?.(index);
    }
  };

  return (
    <div id={item.id || `item-${index}`}>
      <div
        className={`${styles.dropdownMenuItem} ${styles.rounded} ${isSelected ? styles.selected : ''}`}
        data-is-selected={isSelected}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      >
        <div className={styles.menuItemMainContent}>
          <div className={styles.menuItemLeftSection}>
            {/* Icon area - only show when has icon */}
            {hasIcon && (
              <span className={styles.menuItemIconSpan}>
                {typeof iconSlot === 'function'
                  ? iconSlot(item)
                  : iconSlot || (item.icon && <i className={`codicon ${item.icon}`}></i>)
                }
              </span>
            )}

            {/* Text area */}
            <div className={styles.menuItemTextSection}>
              {/* Main content */}
              <div className={styles.fileInfoContainer}>
                <span className={styles.monacoHighlightedLabel}>
                  {item.label || item.name}
                </span>
              </div>
              {/* Detail info */}
              {item.detail && (
                <span className={styles.filePathContainer}>
                  <span className={`${styles.monacoHighlightedLabel} ${styles.filePathText}`}>
                    {item.detail}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Right section */}
          {(item.rightIcon || item.checked) && (
            <div className={styles.menuItemRightSection}>
              {item.checked ? (
                <span className={`${styles.checkIcon} codicon codicon-check`}></span>
              ) : item.rightIcon ? (
                <span className={`${styles.submenuArrowIcon} codicon ${item.rightIcon}`}></span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default DropdownItem;
