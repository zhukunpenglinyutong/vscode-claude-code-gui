import React, {
  memo,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo
} from 'react';
import { Codicon } from '../../common';

interface ChatInputBoxProps {
  showProgress?: boolean;
  progressPercentage?: number;
  placeholder?: string;
  readonly?: boolean;
  showSearch?: boolean;
  selectedModel?: string;
  conversationWorking?: boolean;
  onSubmit?: (content: string) => void;
  onQueueMessage?: (content: string) => void;
  onStop?: () => void;
  onInput?: (content: string) => void;
  onAttach?: () => void;
  onImage?: () => void;
  onSearch?: (query: string) => void;
  onAddContext?: () => void;
  onAgentDropdown?: () => void;
  onModelDropdown?: () => void;
}

export interface ChatInputBoxRef {
  setContent: (text: string) => void;
  focus: () => void;
}

export const ChatInputBox = memo(forwardRef<ChatInputBoxRef, ChatInputBoxProps>(
  function ChatInputBox(props, ref) {
    const {
      showProgress = true,
      progressPercentage = 48.7,
      placeholder = '输入内容,@ 添加上下文,/ 使用命令...',
      selectedModel = 'claude-4-sonnet',
      conversationWorking = false,
      onSubmit,
      onQueueMessage,
      onStop,
      onInput,
      onImage,
      onAddContext,
      onModelDropdown
    } = props;

    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLDivElement>(null);

    // Progress circle calculations
    const circumference = useMemo(() => 2 * Math.PI * 5.25, []);
    const strokeOffset = useMemo(() => {
      const progress = Math.max(0, Math.min(100, progressPercentage));
      return circumference - (progress / 100) * circumference;
    }, [progressPercentage, circumference]);

    const isSubmitDisabled = !content.trim();

    const autoResizeTextarea = useCallback(() => {
      if (!textareaRef.current) return;

      const divElement = textareaRef.current;
      divElement.style.height = '20px';

      const scrollHeight = divElement.scrollHeight;
      const minHeight = 20;
      const maxHeight = 240;

      if (scrollHeight <= maxHeight) {
        divElement.style.height = Math.max(scrollHeight, minHeight) + 'px';
        divElement.style.overflowY = 'hidden';
      } else {
        divElement.style.height = maxHeight + 'px';
        divElement.style.overflowY = 'auto';
      }
    }, []);

    const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const textContent = target.textContent || '';

      if (textContent.length === 0) {
        target.innerHTML = '';
      }

      setContent(textContent);
      onInput?.(textContent);
      autoResizeTextarea();
    }, [onInput, autoResizeTextarea]);

    const handleSubmit = useCallback(() => {
      if (!content.trim()) return;

      if (conversationWorking) {
        onQueueMessage?.(content);
      } else {
        onSubmit?.(content);
      }

      setContent('');
      if (textareaRef.current) {
        textareaRef.current.textContent = '';
      }
    }, [content, conversationWorking, onSubmit, onQueueMessage]);

    const handleKeydown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        setTimeout(() => {
          const target = event.currentTarget;
          const textContent = target.textContent || '';
          if (textContent.length === 0) {
            target.innerHTML = '';
            setContent('');
          }
        }, 0);
      }
    }, [handleSubmit]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      setContent: (text: string) => {
        setContent(text || '');
        if (textareaRef.current) {
          textareaRef.current.textContent = text || '';
        }
        autoResizeTextarea();
      },
      focus: () => {
        textareaRef.current?.focus();
      }
    }), [autoResizeTextarea]);

    return (
      <div className="flex flex-col gap-2 py-2 px-3 bg-vscode-input-bg border border-vscode-input-border rounded-lg focus-within:border-vscode-focus-border">
        {/* First row: Add Context + Progress indicator */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Add Context button */}
            <div
              className="cursor-pointer flex items-center justify-center py-0.5 px-0.5 h-5 box-border rounded border border-vscode-input-border gap-0.5 hover:bg-vscode-toolbar-hover [&_span:first-child]:text-[11px] [&_span:first-child]:text-vscode-fg/60 [&_span:first-child]:pl-0.5 [&_span:last-child]:text-vscode-fg/[0.68] [&_span:last-child]:text-xs [&_span:last-child]:mx-0.5"
              onClick={onAddContext}
            >
              <Codicon name="at-sign" size={11} />
              <span>添加上下文</span>
            </div>
          </div>

          {/* Progress indicator */}
          {showProgress && (
            <div className="flex items-center gap-1 py-0.5 px-1.5 bg-vscode-input-bg rounded shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
              <span className="text-xs text-vscode-fg/50">{progressPercentage}%</span>
              <div className="w-3.5 h-3.5">
                <svg width="14" height="14">
                  <circle
                    fill="none"
                    opacity="0.25"
                    cx="7"
                    cy="7"
                    r="5.25"
                    stroke="var(--vscode-foreground)"
                    strokeWidth="1.5"
                  />
                  <circle
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.9"
                    cx="7"
                    cy="7"
                    r="5.25"
                    stroke="var(--vscode-foreground)"
                    strokeWidth="1.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    transform="rotate(-90 7 7)"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Second row: Input area */}
        <div
          ref={textareaRef}
          contentEditable
          className="resize-none leading-normal font-inherit text-[13px] text-vscode-input-fg bg-transparent block outline-none scrollbar-none box-border border-none break-words p-0 select-text whitespace-pre-wrap relative empty:before:content-[attr(data-placeholder)] empty:before:text-vscode-input-placeholder empty:before:pointer-events-none empty:before:absolute focus:outline-none focus:border-none"
          data-placeholder={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeydown}
          style={{
            minHeight: '34px',
            maxHeight: '240px',
            resize: 'none',
            overflowY: 'hidden',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            width: '100%',
            height: '34px'
          }}
        />

        {/* Third row: Button area */}
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {/* Image button */}
            <button
              className="flex items-center justify-center w-6 h-6 border-none bg-transparent text-vscode-fg rounded cursor-pointer opacity-70 hover:bg-vscode-toolbar-hover hover:opacity-100"
              title="添加图片"
              onClick={onImage}
            >
              <Codicon name="device-camera" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Model selector */}
            <button
              className="flex items-center gap-1 py-0.5 px-2 border-none bg-transparent text-vscode-fg/70 rounded cursor-pointer text-xs hover:bg-vscode-toolbar-hover"
              onClick={onModelDropdown}
            >
              <span>{selectedModel}</span>
              <Codicon name="chevron-down" size={12} />
            </button>

            {/* Submit/Stop button */}
            {conversationWorking ? (
              <button
                className="flex items-center justify-center w-7 h-7 border-none bg-vscode-charts-red text-white rounded-md cursor-pointer hover:opacity-90"
                onClick={onStop}
                title="停止"
              >
                <Codicon name="debug-stop" />
              </button>
            ) : (
              <button
                className={`flex items-center justify-center w-7 h-7 border-none bg-vscode-button-bg text-vscode-button-fg rounded-md cursor-pointer hover:bg-vscode-button-hover disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                title="发送消息"
              >
                <Codicon name="arrow-up" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
));

export default ChatInputBox;
