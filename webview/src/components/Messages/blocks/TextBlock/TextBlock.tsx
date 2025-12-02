import React, { memo, useMemo } from 'react';
import { marked } from 'marked';
import type { ContentBlock } from '../../../../types/messages';
import styles from './TextBlock.module.css';

interface TextBlockProps {
  block: ContentBlock;
  streaming?: boolean;
}

// Configure marked
marked.setOptions({
  breaks: true,        // Support GFM line breaks
  gfm: true,          // Enable GitHub Flavored Markdown
});

export const TextBlock = memo(function TextBlock({
  block,
  streaming = false
}: TextBlockProps) {
  const formattedText = useMemo(() => {
    if (!block.text) return '';

    try {
      return marked.parse(block.text, { async: false }) as string;
    } catch (error) {
      console.error('Markdown parsing failed:', error);
      // Fallback: return escaped text
      return block.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }, [block.text]);

  return (
    <div className={styles.textBlock}>
      <div
        className={styles.textContent}
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
      {streaming && <span className={styles.streamingCursor}>|</span>}
    </div>
  );
});

export default TextBlock;
