import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../store/sessionStore';
import { Icon } from '../components/common/Icon';

interface SessionsPageProps {
  onSwitchToChat: (sessionId?: string) => void;
}

export const SessionsPage = memo(function SessionsPage({
  onSwitchToChat
}: SessionsPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy] = useState('timestamp');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sessions = useSessionStore((state) => state.sessions);
  const requestSessionList = useSessionStore((state) => state.requestSessionList);
  const loadSession = useSessionStore((state) => state.loadSession);
  const createNewSession = useSessionStore((state) => state.createNewSession);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.label.toLowerCase().includes(query) ||
        session.id.toLowerCase().includes(query)
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'label':
          return a.label.localeCompare(b.label);
        case 'messageCount':
          return b.messages.length - a.messages.length;
        default:
          return 0;
      }
    });
  }, [sessions, searchQuery, sortBy]);

  // Refresh sessions
  const refreshSessions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      requestSessionList();
    } catch (err) {
      setError(`加载会话失败: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [requestSessionList]);

  // Open session
  const openSession = useCallback((session: any) => {
    loadSession(session.id);
    onSwitchToChat(session.id);
  }, [loadSession, onSwitchToChat]);

  // Create new session
  const handleCreateNewSession = useCallback(() => {
    createNewSession();
    onSwitchToChat();
  }, [createNewSession, onSwitchToChat]);

  // Start new chat
  const startNewChat = useCallback(() => {
    onSwitchToChat();
  }, [onSwitchToChat]);

  // Toggle search
  const toggleSearch = useCallback(async () => {
    setShowSearch(prev => {
      const newValue = !prev;
      if (newValue) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      } else {
        setSearchQuery('');
      }
      return newValue;
    });
  }, []);

  // Hide search
  const hideSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
  }, []);

  // Format date
  const formatDate = useCallback((timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      return '刚刚';
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      const days = Math.floor(hours / 24);
      if (days < 7) {
        return `${days}天前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    }
  }, []);

  // Get last message preview
  const getLastMessagePreview = useCallback((session: any) => {
    if (session.messages.length === 0) {
      return '无消息';
    }

    const lastMessage = session.messages[session.messages.length - 1];
    let content = '';

    if (lastMessage.message?.content) {
      if (typeof lastMessage.message.content === 'string') {
        content = lastMessage.message.content;
      } else if (Array.isArray(lastMessage.message.content)) {
        const textBlocks = lastMessage.message.content.filter((block: any) => block.type === 'text');
        content = textBlocks.map((block: any) => block.text).join(' ');
      }
    }

    return content.length > 80 ? content.substring(0, 80) + '...' : content;
  }, []);

  // Load sessions on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  return (
    <div className="flex flex-col h-full text-vscode-editor-fg">
      <div className="flex justify-between items-center border-b border-vscode-panel-border min-h-8 px-3">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center w-6 h-6 border-none bg-transparent text-vscode-titlebar-fg rounded cursor-pointer transition-colors duration-200 [&_.codicon]:text-xs hover:bg-vscode-toolbar-hover"
            onClick={() => onSwitchToChat()}
          >
            <span className="codicon codicon-arrow-left"></span>
          </button>
          <h2 className="m-0 text-xs font-semibold text-vscode-titlebar-fg">会话</h2>
        </div>
        <div className="flex items-center flex-1 justify-center"></div>
        <div className="flex gap-1">
          <button
            className={`flex items-center justify-center w-6 h-6 border-none bg-transparent text-vscode-titlebar-fg rounded cursor-pointer transition-colors duration-200 opacity-70 [&_.codicon]:text-xs hover:bg-vscode-toolbar-hover hover:opacity-100 ${showSearch ? 'bg-vscode-button-bg text-vscode-button-fg opacity-100' : ''}`}
            onClick={toggleSearch}
          >
            <span className="codicon codicon-search"></span>
          </button>
          <button
            className="flex items-center justify-center w-6 h-6 border-none bg-transparent text-vscode-titlebar-fg rounded cursor-pointer transition-colors duration-200 opacity-70 [&_.codicon]:text-xs hover:bg-vscode-toolbar-hover hover:opacity-100"
            onClick={handleCreateNewSession}
          >
            <span className="codicon codicon-add"></span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="border-b border-vscode-panel-border bg-vscode-bg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="搜索代理/对话线程"
              className="w-full py-0.5 px-2 border border-vscode-input-border bg-vscode-input-bg text-vscode-input-fg rounded text-sm outline-none focus:border-vscode-focus-border"
              onKeyDown={(e) => e.key === 'Escape' && hideSearch()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden flex flex-col custom-scroll-container">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-10 text-center flex-1">
            <div className="w-6 h-6 border-2 border-[var(--vscode-progressBar-background)] border-t-[var(--vscode-progressBar-activeForeground)] rounded-full animate-spin mb-4"></div>
            <p>加载会话历史中...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center p-10 text-center flex-1">
            <p className="text-[var(--vscode-errorForeground)] mb-4">{error}</p>
            <button
              className="inline-flex items-center justify-baseline py-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-200 bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover"
              onClick={refreshSessions}
            >
              重试
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center flex-1 gap-4">
            <div className="text-5xl opacity-60">
              <Icon name="comment-discussion" size={48} />
            </div>
            <h3 className="m-0 text-lg font-medium">暂无历史会话</h3>
            <p className="text-[var(--vscode-descriptionForeground)] text-sm m-0">开始与 Claude 对话后，会话历史将出现在这里</p>
            <button
              className="inline-flex items-center justify-baseline py-1.5 px-3 border-none rounded cursor-pointer text-xs transition-colors duration-200 bg-vscode-button-bg text-vscode-button-fg hover:bg-vscode-button-hover"
              onClick={startNewChat}
            >
              开始新对话
            </button>
          </div>
        )}

        {/* Sessions list */}
        {!loading && !error && sessions.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {filteredSessions.map(session => (
              <div
                key={session.id}
                className="border border-vscode-panel-border rounded-lg p-4 bg-vscode-editor-bg cursor-pointer transition-all duration-200 flex flex-col h-[120px] hover:border-vscode-focus-border hover:bg-[var(--vscode-list-hoverBackground)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                onClick={() => openSession(session)}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="m-0 text-sm font-medium flex-1 break-words">{session.label}</h3>
                  <div className="text-[11px] text-[var(--vscode-descriptionForeground)] whitespace-nowrap">{formatDate(session.timestamp)}</div>
                </div>

                <div className="flex justify-between text-[11px] text-[var(--vscode-descriptionForeground)]">
                  <span>{session.messages.length} 条消息</span>
                  <span>ID: {session.id.slice(0, 8)}...</span>
                </div>

                <div className="flex-1 min-h-10">
                  {session.messages.length > 0 ? (
                    <div className="text-xs text-[var(--vscode-descriptionForeground)] leading-relaxed line-clamp-2">
                      {getLastMessagePreview(session)}
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--vscode-descriptionForeground)] italic">尚无对话内容</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default SessionsPage;
