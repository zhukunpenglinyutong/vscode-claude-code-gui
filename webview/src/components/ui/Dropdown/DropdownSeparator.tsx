import { memo } from 'react';
import styles from './Dropdown.module.css';

export const DropdownSeparator = memo(function DropdownSeparator() {
  return <div className={styles.dropdownSeparator}></div>;
});

export default DropdownSeparator;
