import { useEffect, useRef, useState, useCallback } from 'react';

interface Size {
  width: number;
  height: number;
}

interface UseResizeObserverOptions {
  /** 防抖延迟（毫秒） */
  debounce?: number;
  /** 初始尺寸 */
  initialSize?: Size;
  /** 回调函数 */
  onResize?: (size: Size, entry: ResizeObserverEntry) => void;
}

interface UseResizeObserverReturn {
  /** 元素 ref */
  ref: React.RefObject<HTMLElement>;
  /** 当前尺寸 */
  size: Size;
  /** 内容区域尺寸 */
  contentSize: Size;
}

/**
 * ResizeObserver Hook
 * 监听元素尺寸变化
 */
export function useResizeObserver(
  options: UseResizeObserverOptions = {}
): UseResizeObserverReturn {
  const {
    debounce = 0,
    initialSize = { width: 0, height: 0 },
    onResize
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [size, setSize] = useState<Size>(initialSize);
  const [contentSize, setContentSize] = useState<Size>(initialSize);
  const timeoutRef = useRef<number>();
  const callbackRef = useRef(onResize);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const update = () => {
        const { width, height } = entry.contentRect;
        const borderBoxSize = entry.borderBoxSize?.[0];

        const newSize: Size = borderBoxSize
          ? { width: borderBoxSize.inlineSize, height: borderBoxSize.blockSize }
          : { width: element.offsetWidth, height: element.offsetHeight };

        const newContentSize: Size = { width, height };

        setSize(newSize);
        setContentSize(newContentSize);

        if (callbackRef.current) {
          callbackRef.current(newSize, entry);
        }
      };

      if (debounce > 0) {
        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(update, debounce);
      } else {
        update();
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(element);

    // 初始测量
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    setContentSize({ width: element.clientWidth, height: element.clientHeight });

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [debounce]);

  return {
    ref: ref as React.RefObject<HTMLElement>,
    size,
    contentSize
  };
}

/**
 * 简化版 - 只返回尺寸
 */
export function useElementSize(debounce = 0): [React.RefObject<HTMLElement>, Size] {
  const { ref, size } = useResizeObserver({ debounce });
  return [ref, size];
}

/**
 * 组合多个元素的 ResizeObserver
 */
export function useMultiResizeObserver(
  count: number,
  onResize?: (sizes: Size[], entries: ResizeObserverEntry[]) => void
): React.RefObject<HTMLElement>[] {
  const refs = useRef<React.RefObject<HTMLElement>[]>(
    Array.from({ length: count }, () => ({ current: null }))
  );
  const sizesRef = useRef<Size[]>(Array(count).fill({ width: 0, height: 0 }));
  const callbackRef = useRef(onResize);

  useEffect(() => {
    callbackRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const index = refs.current.findIndex((ref) => ref.current === entry.target);
        if (index !== -1) {
          const { width, height } = entry.contentRect;
          sizesRef.current[index] = { width, height };
        }
      });

      if (callbackRef.current) {
        callbackRef.current([...sizesRef.current], entries);
      }
    });

    refs.current.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, [count]);

  return refs.current;
}

export default useResizeObserver;
