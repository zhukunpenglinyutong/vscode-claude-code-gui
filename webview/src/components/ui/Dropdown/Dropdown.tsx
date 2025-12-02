import { memo, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from 'react';
import { ScrollableElement } from '../../common/ScrollableElement';
import styles from './Dropdown.module.css';

export interface DropdownItem {
  id: string;
  type: string;
  [key: string]: any;
}

interface DropdownProps {
  isVisible: boolean;
  position: { top: number; left: number; width?: number; height?: number };
  width?: number;
  contentHeight?: number;
  containerStyle?: React.CSSProperties;
  popoverStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  showSearch?: boolean;
  searchPlaceholder?: string;
  shouldAutoFocus?: boolean;
  closeOnClickOutside?: boolean;
  closeSelectors?: string[];
  align?: 'left' | 'right' | 'center';
  onClose: () => void;
  onSelect?: (item: DropdownItem) => void;
  onSearch?: (term: string) => void;
  header?: ReactNode;
  content?: ReactNode | ((props: { searchTerm: string; selectedIndex: number }) => ReactNode);
  footer?: ReactNode;
}

export const Dropdown = memo(function Dropdown({
  isVisible,
  position,
  width,
  showSearch = false,
  searchPlaceholder = 'Search...',
  shouldAutoFocus = true,
  closeOnClickOutside = true,
  closeSelectors = [],
  align = 'left',
  containerStyle = {},
  popoverStyle = {},
  onClose,
  onSearch,
  header,
  content,
  footer
}: DropdownProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Dropdown style calculation
  const dropdownStyle = useMemo(() => {
    const style: React.CSSProperties = {
      position: 'fixed',
      minWidth: '140px',
      maxWidth: '240px',
      width: width ? `${width}px` : 'auto',
      zIndex: 2548
    };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const triggerRect = position;

    // Calculate dropdown total height
    const searchHeight = showSearch ? 32 : 0;
    const footerHeight = 25;
    const dropdownTotalHeight = searchHeight + 240 + footerHeight;

    // Calculate available space
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.top - (triggerRect.height || 0);

    // Smart position selection
    const showBelow = spaceBelow >= dropdownTotalHeight || spaceBelow > spaceAbove;

    // Vertical positioning
    if (showBelow) {
      style.top = `${triggerRect.top + (triggerRect.height || 0) + 4}px`;
    } else {
      style.bottom = `${viewportHeight - triggerRect.top + 4}px`;
    }

    // Horizontal positioning
    const triggerWidth = triggerRect.width || 0;
    const dropdownWidth = width || 240;

    switch (align) {
      case 'right':
        style.left = `${triggerRect.left + triggerWidth - dropdownWidth}px`;
        break;
      case 'center':
        style.left = `${triggerRect.left + triggerWidth / 2 - dropdownWidth / 2}px`;
        break;
      case 'left':
      default:
        style.left = `${triggerRect.left}px`;
        break;
    }

    // Ensure not exceeding viewport
    const leftBoundary = 8;
    const rightBoundary = viewportWidth - 8;

    const leftValue = parseInt(style.left as string);
    if (leftValue < leftBoundary) {
      style.left = `${leftBoundary}px`;
    } else if (leftValue + dropdownWidth > rightBoundary) {
      style.left = `${rightBoundary - dropdownWidth}px`;
    }

    return { ...style, ...popoverStyle };
  }, [position, width, showSearch, align, popoverStyle]);

  // Handle search input
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  }, [onSearch]);

  // Handle keydown
  const handleKeydown = useCallback((event: KeyboardEvent) => {
    if (!isVisible) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }, [isVisible, onClose]);

  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!isVisible || !closeOnClickOutside) return;

    const target = event.target as HTMLElement;

    // Check if clicked inside dropdown
    if (target.closest(`.${styles.dropdownPopover}`)) return;

    // Check if clicked on trigger element
    const excludeSelectors = [
      '.premium-pill',
      '.dropdown-trigger',
      ...closeSelectors
    ];

    for (const selector of excludeSelectors) {
      if (target.closest(selector)) return;
    }

    onClose();
  }, [isVisible, closeOnClickOutside, closeSelectors, onClose]);

  // Auto focus on search input
  useEffect(() => {
    if (isVisible && shouldAutoFocus && showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isVisible, shouldAutoFocus, showSearch]);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleKeydown, handleClickOutside]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.dropdownPopover} ${styles.fadeInFast}`}
      style={dropdownStyle}
    >
      <div
        tabIndex={0}
        className={styles.dropdownContainer}
        style={containerStyle}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        {/* Search input */}
        {showSearch && (
          <div className={styles.searchInputSection}>
            <input
              ref={searchInputRef}
              value={searchTerm}
              className={styles.contextSearchInput}
              placeholder={searchPlaceholder}
              onChange={handleSearchInput}
            />
          </div>
        )}

        {/* Header slot */}
        {header}

        {/* Scrollable content */}
        <ScrollableElement>
          <div className={styles.menuContent}>
            {typeof content === 'function'
              ? content({ searchTerm, selectedIndex })
              : content
            }
          </div>
        </ScrollableElement>

        {/* Footer slot */}
        {footer}
      </div>
    </div>
  );
});

export default Dropdown;
