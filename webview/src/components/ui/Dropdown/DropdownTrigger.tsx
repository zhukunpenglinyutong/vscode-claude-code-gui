import { memo, useState, useCallback, useMemo, useEffect, useRef, ReactNode, forwardRef, useImperativeHandle } from 'react';
import { ScrollableElement } from '../../common/ScrollableElement';
import styles from './Dropdown.module.css';

interface DropdownTriggerProps {
  // Trigger related
  triggerClass?: string;
  triggerStyle?: React.CSSProperties;
  triggerProps?: React.HTMLAttributes<HTMLDivElement>;

  // Dropdown related
  width?: number;
  contentHeight?: number;
  containerStyle?: React.CSSProperties;
  popoverStyle?: React.CSSProperties;

  // Feature config
  showSearch?: boolean;
  searchPlaceholder?: string;
  shouldAutoFocus?: boolean;
  closeOnClickOutside?: boolean;
  align?: 'left' | 'right' | 'center';

  // Behavior control
  disabled?: boolean;

  // Events
  onOpen?: () => void;
  onClose?: () => void;
  onSearch?: (term: string) => void;
  onToggle?: (isOpen: boolean) => void;

  // Slots
  trigger?: ReactNode | ((props: { isOpen: boolean; toggle: () => void }) => ReactNode);
  header?: ReactNode;
  content?: ReactNode | ((props: { searchTerm: string; close: () => void }) => ReactNode);
  footer?: ReactNode;
}

export interface DropdownTriggerRef {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}

export const DropdownTrigger = memo(forwardRef<DropdownTriggerRef, DropdownTriggerProps>(function DropdownTrigger({
  triggerClass = '',
  triggerStyle = {},
  triggerProps = {},
  width,
  containerStyle = {},
  popoverStyle = {},
  showSearch = false,
  searchPlaceholder = 'Search...',
  shouldAutoFocus = true,
  closeOnClickOutside = true,
  align = 'left',
  disabled = false,
  onOpen,
  onClose,
  onSearch,
  onToggle,
  trigger,
  header,
  content,
  footer
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown style calculation
  const dropdownStyle = useMemo(() => {
    const style: React.CSSProperties = {
      position: 'absolute',
      minWidth: '140px',
      maxWidth: '240px',
      width: width ? `${width}px` : 'auto',
      zIndex: 2548
    };

    if (!triggerRef.current) return style;

    const viewportHeight = window.innerHeight;
    const triggerRect = triggerRef.current.getBoundingClientRect();

    // Calculate dropdown total height
    const searchHeight = showSearch ? 32 : 0;
    const footerHeight = 25;
    const dropdownTotalHeight = searchHeight + 240 + footerHeight;

    // Calculate available space
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;

    // Smart position selection
    const showBelow = spaceBelow >= dropdownTotalHeight || spaceBelow > spaceAbove;

    // Vertical positioning - relative to trigger
    if (showBelow) {
      style.top = '100%';
      style.marginTop = '4px';
    } else {
      style.bottom = '100%';
      style.top = 'auto';
      style.marginBottom = '4px';
    }

    // Horizontal positioning - relative to trigger
    switch (align) {
      case 'right':
        style.right = '0';
        style.left = 'auto';
        break;
      case 'center':
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        break;
      case 'left':
      default:
        style.left = '0';
        break;
    }

    return { ...style, ...popoverStyle };
  }, [width, showSearch, align, popoverStyle, isVisible]);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (disabled) return;

    if (isVisible) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [disabled, isVisible]);

  // Open dropdown
  const openDropdown = useCallback(() => {
    if (disabled) return;

    setIsVisible(true);
    onOpen?.();
    onToggle?.(true);

    if (shouldAutoFocus && showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [disabled, onOpen, onToggle, shouldAutoFocus, showSearch]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsVisible(false);
    setSearchTerm('');
    onClose?.();
    onToggle?.(false);
  }, [onClose, onToggle]);

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
      closeDropdown();
    }
  }, [isVisible, closeDropdown]);

  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!isVisible || !closeOnClickOutside) return;

    const target = event.target as HTMLElement;

    // Check if clicked inside component
    if (containerRef.current?.contains(target)) return;

    closeDropdown();
  }, [isVisible, closeOnClickOutside, closeDropdown]);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleKeydown, handleClickOutside]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    open: openDropdown,
    close: closeDropdown,
    toggle: toggleDropdown,
    isOpen: isVisible
  }), [openDropdown, closeDropdown, toggleDropdown, isVisible]);

  return (
    <>
      <div ref={containerRef} className={styles.dropdownTriggerContainer}>
        {/* Trigger button */}
        <div
          ref={triggerRef}
          className={triggerClass}
          style={triggerStyle}
          onClick={toggleDropdown}
          {...triggerProps}
        >
          {typeof trigger === 'function'
            ? trigger({ isOpen: isVisible, toggle: toggleDropdown })
            : trigger || <span className="codicon codicon-chevron-down"></span>
          }
        </div>

        {/* Dropdown menu */}
        {isVisible && (
          <div
            className={styles.dropdownTriggerPopover}
            style={dropdownStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              tabIndex={0}
              className={styles.dropdownTriggerContainerInner}
              style={containerStyle}
              onKeyDown={(e) => e.key === 'Escape' && closeDropdown()}
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
                    ? content({ searchTerm, close: closeDropdown })
                    : content
                  }
                </div>
              </ScrollableElement>

              {/* Footer slot */}
              {footer}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for click outside */}
      {isVisible && closeOnClickOutside && (
        <div
          className={styles.dropdownTriggerBackdrop}
          onClick={closeDropdown}
        />
      )}
    </>
  );
}));

export default DropdownTrigger;
