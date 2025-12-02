import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  memo
} from 'react';
import styles from './ScrollableElement.module.css';

interface ScrollableElementProps {
  /** 容器高度 */
  height?: string | number;
  /** 容器宽度 */
  width?: string | number;
  /** 子元素 */
  children: React.ReactNode;
  /** 滚动事件回调 */
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export interface ScrollableElementRef {
  /** 滚动到指定位置 */
  scrollTo: (top: number, left?: number) => void;
  /** 滚动到底部 */
  scrollToBottom: () => void;
  /** 滚动到顶部 */
  scrollToTop: () => void;
  /** 获取当前滚动位置 */
  getScrollPosition: () => { scrollTop: number; scrollLeft: number };
  /** 检查是否在底部 */
  isAtBottom: () => boolean;
}

/**
 * 自定义滚动容器组件
 * 模仿 VS Code Monaco 编辑器的滚动条样式
 */
export const ScrollableElement = memo(forwardRef<ScrollableElementRef, ScrollableElementProps>(
  function ScrollableElement(
    {
      height = '100%',
      width = '100%',
      children,
      onScroll,
      className = '',
      style
    },
    ref
  ) {
    // DOM 引用
    const containerRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);

    // 滚动状态
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollHeight, setScrollHeight] = useState(0);
    const [scrollWidth, setScrollWidth] = useState(0);
    const [clientHeight, setClientHeight] = useState(0);
    const [clientWidth, setClientWidth] = useState(0);
    const [isScrollbarVisible, setIsScrollbarVisible] = useState(false);

    // 拖拽状态
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'vertical' | 'horizontal' | null>(null);
    const dragStartPosRef = useRef(0);
    const dragStartScrollRef = useRef(0);
    const scrollbarFadeTimerRef = useRef<number>();

    // 计算属性
    const showVerticalScrollbar = scrollHeight > clientHeight;
    const showHorizontalScrollbar = scrollWidth > clientWidth;
    const isScrolledToBottom = scrollTop >= scrollHeight - clientHeight - 1;

    // 更新尺寸
    const updateDimensions = useCallback(() => {
      if (!contentWrapperRef.current || !contentContainerRef.current) return;

      const wrapperRect = contentWrapperRef.current.getBoundingClientRect();
      setClientHeight(wrapperRect.height);
      setClientWidth(wrapperRect.width);

      let actualHeight = contentContainerRef.current.scrollHeight;
      let actualWidth = contentContainerRef.current.scrollWidth;

      const children = contentContainerRef.current.children;
      if (children.length > 0) {
        let maxHeight = 0;
        let maxWidth = 0;

        for (let i = 0; i < children.length; i++) {
          const child = children[i] as HTMLElement;
          const childRect = child.getBoundingClientRect();
          const containerRect = contentContainerRef.current.getBoundingClientRect();

          const childBottom = childRect.bottom - containerRect.top;
          const childRight = childRect.right - containerRect.left;

          maxHeight = Math.max(maxHeight, childBottom);
          maxWidth = Math.max(maxWidth, childRight);
        }

        actualHeight = Math.max(actualHeight, maxHeight);
        actualWidth = Math.max(actualWidth, maxWidth);
      }

      setScrollHeight(actualHeight);
      setScrollWidth(actualWidth);
    }, []);

    // 显示滚动条
    const showScrollbars = useCallback(() => {
      setIsScrollbarVisible(true);
      if (scrollbarFadeTimerRef.current) {
        clearTimeout(scrollbarFadeTimerRef.current);
      }
    }, []);

    // 隐藏滚动条
    const hideScrollbars = useCallback(() => {
      if (!isDragging) {
        scrollbarFadeTimerRef.current = window.setTimeout(() => {
          setIsScrollbarVisible(false);
        }, 800);
      }
    }, [isDragging]);

    // 滚轮处理
    const handleWheel = useCallback((event: React.WheelEvent) => {
      event.preventDefault();

      const deltaY = event.deltaY;
      const deltaX = event.deltaX;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        const newScrollTop = Math.max(0, Math.min(scrollHeight - clientHeight, scrollTop + deltaY));
        setScrollTop(newScrollTop);
      } else {
        const newScrollLeft = Math.max(0, Math.min(scrollWidth - clientWidth, scrollLeft + deltaX));
        setScrollLeft(newScrollLeft);
      }

      showScrollbars();
    }, [scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth, showScrollbars]);

    // 垂直拖拽开始
    const startVerticalDrag = useCallback((event: React.MouseEvent) => {
      event.preventDefault();
      setIsDragging(true);
      setDragType('vertical');
      dragStartPosRef.current = event.clientY;
      dragStartScrollRef.current = scrollTop;
    }, [scrollTop]);

    // 水平拖拽开始
    const startHorizontalDrag = useCallback((event: React.MouseEvent) => {
      event.preventDefault();
      setIsDragging(true);
      setDragType('horizontal');
      dragStartPosRef.current = event.clientX;
      dragStartScrollRef.current = scrollLeft;
    }, [scrollLeft]);

    // 处理拖拽
    const handleDrag = useCallback((event: MouseEvent) => {
      if (!isDragging) return;

      if (dragType === 'vertical') {
        const deltaY = event.clientY - dragStartPosRef.current;
        const ratio = deltaY / (clientHeight - (clientHeight * clientHeight / scrollHeight));
        const newScrollTop = Math.max(0, Math.min(
          scrollHeight - clientHeight,
          dragStartScrollRef.current + ratio * (scrollHeight - clientHeight)
        ));
        setScrollTop(newScrollTop);
      } else if (dragType === 'horizontal') {
        const deltaX = event.clientX - dragStartPosRef.current;
        const ratio = deltaX / (clientWidth - (clientWidth * clientWidth / scrollWidth));
        const newScrollLeft = Math.max(0, Math.min(
          scrollWidth - clientWidth,
          dragStartScrollRef.current + ratio * (scrollWidth - clientWidth)
        ));
        setScrollLeft(newScrollLeft);
      }
    }, [isDragging, dragType, clientHeight, clientWidth, scrollHeight, scrollWidth]);

    // 结束拖拽
    const endDrag = useCallback(() => {
      setIsDragging(false);
      setDragType(null);
      hideScrollbars();
    }, [hideScrollbars]);

    // 计算滚动条样式
    const verticalSliderStyle = (() => {
      const ratio = clientHeight / scrollHeight;
      const sliderHeight = Math.max(clientHeight * ratio, 20);
      const sliderTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - sliderHeight);

      return {
        position: 'absolute' as const,
        top: `${sliderTop || 0}px`,
        left: '0px',
        width: '6px',
        height: `${sliderHeight}px`,
        transform: 'translate3d(0px, 0px, 0px)'
      };
    })();

    const horizontalSliderStyle = (() => {
      const ratio = clientWidth / scrollWidth;
      const sliderWidth = Math.max(clientWidth * ratio, 20);
      const sliderLeft = (scrollLeft / (scrollWidth - clientWidth)) * (clientWidth - sliderWidth);

      return {
        position: 'absolute' as const,
        top: '0px',
        left: `${sliderLeft || 0}px`,
        height: '10px',
        width: `${sliderWidth}px`,
        transform: 'translate3d(0px, 0px, 0px)'
      };
    })();

    // 监听拖拽事件
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', endDrag);

        return () => {
          document.removeEventListener('mousemove', handleDrag);
          document.removeEventListener('mouseup', endDrag);
        };
      }
    }, [isDragging, handleDrag, endDrag]);

    // ResizeObserver
    useEffect(() => {
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(updateDimensions);
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      if (contentContainerRef.current) {
        resizeObserver.observe(contentContainerRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [updateDimensions]);

    // MutationObserver
    useEffect(() => {
      if (!contentContainerRef.current) return;

      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(updateDimensions);
      });

      mutationObserver.observe(contentContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });

      return () => mutationObserver.disconnect();
    }, [updateDimensions]);

    // 初始测量
    useEffect(() => {
      requestAnimationFrame(updateDimensions);
    }, [updateDimensions]);

    // 滚动回调
    useEffect(() => {
      onScroll?.(scrollTop, scrollLeft);
    }, [scrollTop, scrollLeft, onScroll]);

    // 清理定时器
    useEffect(() => {
      return () => {
        if (scrollbarFadeTimerRef.current) {
          clearTimeout(scrollbarFadeTimerRef.current);
        }
      };
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      scrollTo: (top: number, left = 0) => {
        setScrollTop(Math.max(0, Math.min(scrollHeight - clientHeight, top)));
        setScrollLeft(Math.max(0, Math.min(scrollWidth - clientWidth, left)));
      },
      scrollToBottom: () => {
        setScrollTop(Math.max(0, scrollHeight - clientHeight));
      },
      scrollToTop: () => {
        setScrollTop(0);
      },
      getScrollPosition: () => ({ scrollTop, scrollLeft }),
      isAtBottom: () => isScrolledToBottom
    }), [scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth, isScrolledToBottom]);

    const heightStyle = typeof height === 'number' ? `${height}px` : height;

    return (
      <div
        ref={containerRef}
        className={`${styles.monacoScrollableElement} ${className}`}
        role="presentation"
        onWheel={handleWheel}
        onMouseEnter={showScrollbars}
        onMouseLeave={hideScrollbars}
        style={style}
      >
        {/* 内容容器 */}
        <div
          ref={contentWrapperRef}
          className={styles.scrollableContentWrapper}
          style={{
            width: '100%',
            overflow: 'hidden',
            height: heightStyle,
            position: 'relative'
          }}
        >
          <div
            ref={contentContainerRef}
            className={styles.scrollableContentContainer}
            style={{
              display: 'inline-block',
              position: 'relative',
              width: '100%',
              minHeight: '100%',
              transform: `translate3d(${-scrollLeft}px, ${-scrollTop}px, 0px)`,
              zIndex: 0,
              boxSizing: 'border-box'
            }}
          >
            {children}
          </div>
        </div>

        {/* 垂直滚动条 */}
        {showVerticalScrollbar && (
          <div
            className={`${styles.scrollbar} ${styles.vertical} ${
              isScrollbarVisible ? styles.visible : styles.invisible
            } ${styles.fade}`}
            role="presentation"
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: '6px',
              height: `${clientHeight}px`,
              right: '0px',
              top: '0px'
            }}
            onMouseDown={startVerticalDrag}
          >
            <div className={styles.slider} style={verticalSliderStyle} />
          </div>
        )}

        {/* 水平滚动条 */}
        {showHorizontalScrollbar && (
          <div
            className={`${styles.scrollbar} ${styles.horizontal} ${
              isScrollbarVisible ? styles.visible : styles.invisible
            } ${styles.fade}`}
            role="presentation"
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: `${clientWidth}px`,
              height: '10px',
              left: '0px',
              bottom: '0px'
            }}
            onMouseDown={startHorizontalDrag}
          >
            <div className={styles.slider} style={horizontalSliderStyle} />
          </div>
        )}

        {/* 阴影效果 */}
        {scrollTop > 0 && <div className={`${styles.shadow} ${styles.top}`} />}
        {!isScrolledToBottom && scrollHeight > clientHeight && <div className={styles.shadow} />}
      </div>
    );
  }
));

export default ScrollableElement;
