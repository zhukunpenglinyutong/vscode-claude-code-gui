import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatPage } from './pages';
import { SessionsPage } from './pages/SessionsPage';
import { useMessageBus, notifyUIReady, requestSessionList } from './hooks';

type PageType = 'chat' | 'sessions';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('chat');

  // Initialize message bus
  useMessageBus();

  // Notify UI ready on mount
  useEffect(() => {
    notifyUIReady();
    requestSessionList();
  }, []);

  // Handle switch to chat (optionally with a session id)
  const handleSwitchToChat = useCallback((sessionId?: string) => {
    // If sessionId is provided, the session will be loaded by SessionsPage
    setCurrentPage('chat');
  }, []);

  // Handle switch to sessions
  const handleSwitchToSessions = useCallback(() => {
    setCurrentPage('sessions');
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-vscode-bg text-vscode-fg font-[var(--vscode-font-family)] text-[length:var(--vscode-font-size)] overflow-hidden">
      <AnimatePresence mode="wait">
        {currentPage === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            <ChatPage onSwitchToSessions={handleSwitchToSessions} />
          </motion.div>
        )}

        {currentPage === 'sessions' && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            <SessionsPage onSwitchToChat={handleSwitchToChat} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
