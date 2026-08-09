import { createContext, useContext, useState, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import useChat from '../hooks/useChat';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Restore session from sessionStorage
    return sessionStorage.getItem('chat_username') || null;
  });

  const [activeChatUser, setActiveChatUser] = useState(null);

  const { socket, isConnected, connectionStatus, disconnect } = useSocket(currentUser);
  const {
    messages,
    contacts,
    typingUsers,
    loading,
    error,
    sendMessage,
    handleTyping,
    markAsRead,
    setError,
    fetchContacts,
  } = useChat(currentUser, isConnected, activeChatUser);

  const joinChat = useCallback((username) => {
    const trimmed = username.trim();
    sessionStorage.setItem('chat_username', trimmed);
    setCurrentUser(trimmed);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('chat_username');
    disconnect();
    setCurrentUser(null);
    setActiveChatUser(null);
  }, [disconnect]);

  const value = {
    currentUser,
    activeChatUser,
    setActiveChatUser,
    messages,
    contacts,
    typingUsers,
    loading,
    error,
    isConnected,
    connectionStatus,
    joinChat,
    logout,
    sendMessage,
    handleTyping,
    markAsRead,
    setError,
    fetchContacts,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
