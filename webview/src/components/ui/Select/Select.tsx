import { memo, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Select.module.css';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = memo(function Select({
  value,
  options,
  placeholder = '请选择',
  onChange
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find(option => option.value === value);
    return selected?.label || placeholder;
  }, [options, value, placeholder]);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const selectOption = useCallback((option: SelectOption) => {
    onChange?.(option.value);
    setIsOpen(false);
  }, [onChange]);

  // Handle click outside
  const handleClickOutside = useCallback((event: Event) => {
    if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
      closeDropdown();
    }
  }, [closeDropdown]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div ref={selectRef} className={`${styles.customSelect} ${isOpen ? styles.open : ''}`}>
      <button
        className={`${styles.selectButton} ${isOpen ? styles.active : ''}`}
        onClick={toggleDropdown}
      >
        <span className={styles.selectText}>{selectedLabel}</span>
        <span className={`codicon codicon-chevron-down ${styles.selectIcon} ${isOpen ? styles.rotated : ''}`}></span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.selectDropdown}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {options.map(option => (
              <div
                key={option.value}
                className={`${styles.selectOption} ${option.value === value ? styles.selected : ''}`}
                onClick={() => selectOption(option)}
              >
                {option.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Select;
