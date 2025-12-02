import { useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  /** 是否启用自动滚动 */
  enabled?: boolean;
  /** 距离底部多少像素内视为"在底部" */
  threshold?: number;
  /** 平滑滚动 */
  smooth?: boolean;
  /** 依赖项变化时触发滚动 */
  dependencies?: any[];
}

interface UseAutoScrollReturn {
  /** 滚动容器 ref */
  containerRef: React.RefObject<HTMLElement>;
  /** 是否在底部 */
  isAtBottom: boolean;
  /** 手动滚动到底部 */
  scrollToBottom: (smooth?: boolean) => void;
  /** 手动滚动到顶部 */
  scrollToTop: (smooth?: boolean) => void;
  /** 手动滚动到指定位置 */
  scrollTo: (top: number, smooth?: boolean) => void;
}

/**
 * 自动滚动 Hook
 * 当内容变化时自动滚动到底部（如果用户已经在底部）
 */
export function useAutoScroll(options: UseAutoScrollOptions = {}): UseAutoScrollReturn {
  const {
    enabled = true,
    threshold = 50,
    smooth = true,
    dependencies = []
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const isAtBottomRef = useRef(true);
  const userScrolledRef = useRef(false);

  /**
   * 检查是否在底部
   */
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, [threshold]);

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback((useSmooth = smooth) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: useSmooth ? 'smooth' : 'auto'
    });
    isAtBottomRef.current = true;
    userScrolledRef.current = false;
  }, [smooth]);

  /**
   * 滚动到顶部
   */
  const scrollToTop = useCallback((useSmooth = smooth) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: useSmooth ? 'smooth' : 'auto'
    });
    isAtBottomRef.current = false;
  }, [smooth]);

  /**
   * 滚动到指定位置
   */
  const scrollTo = useCallback((top: number, useSmooth = smooth) => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top,
      behavior: useSmooth ? 'smooth' : 'auto'
    });
    isAtBottomRef.current = checkIfAtBottom();
  }, [smooth, checkIfAtBottom]);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom = checkIfAtBottom();
      isAtBottomRef.current = atBottom;

      // 如果用户向上滚动，标记为用户滚动
      if (!atBottom) {
        userScrolledRef.current = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  // 依赖项变化时自动滚动
  useEffect(() => {
    if (!enabled) return;

    // 如果用户没有主动滚动，或者已经在底部，则自动滚动
    if (!userScrolledRef.current || isAtBottomRef.current) {
      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [...dependencies, enabled, scrollToBottom]);

  // 监听内容变化（使用 MutationObserver）
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      if (!userScrolledRef.current || isAtBottomRef.current) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [enabled, scrollToBottom]);

  return {
    containerRef: containerRef as React.RefObject<HTMLElement>,
    isAtBottom: isAtBottomRef.current,
    scrollToBottom,
    scrollToTop,
    scrollTo
  };
}

export default useAutoScroll;
