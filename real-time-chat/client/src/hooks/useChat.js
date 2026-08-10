import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';
import { getLatestMessages, getContacts, sendMessageREST } from '../services/api';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    oscillator.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    // Ignore if audio context fails (e.g. strict autoplay policy)
  }
};

/**
 * Custom hook for managing chat state and socket events
 */
const useChat = (username, isConnected, activeChatUser) => {
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track message IDs to prevent duplicates
  const messageIdsRef = useRef(new Set());
  const historyLoadedRef = useRef(false);
  const bufferedMessagesRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // ── Fetch contacts ──
  const fetchContacts = useCallback(async () => {
    if (!username) return;
    try {
      const response = await getContacts(username);
      setContacts(response.data?.contacts || []);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  }, [username]);

  // Initial contacts load
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ── Fetch chat history when active chat changes ──
  useEffect(() => {
    if (!username || !activeChatUser) {
      setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        historyLoadedRef.current = false;
        messageIdsRef.current.clear();

        const response = await getLatestMessages(username, activeChatUser, 50);
        const fetchedMessages = response.data?.messages || [];

        // Store message IDs
        fetchedMessages.forEach((msg) => {
          messageIdsRef.current.add(msg._id);
        });

        setMessages(fetchedMessages);
        historyLoadedRef.current = true;

        // Merge any buffered messages that arrived during loading
        if (bufferedMessagesRef.current.length > 0) {
          const newMessages = bufferedMessagesRef.current.filter((msg) => {
            const isForActiveChat = 
              (msg.username === activeChatUser && msg.receiver === username) || 
              (msg.username === username && msg.receiver === activeChatUser);
            return isForActiveChat && !messageIdsRef.current.has(msg._id);
          });
          
          newMessages.forEach((msg) => messageIdsRef.current.add(msg._id));
          if (newMessages.length > 0) {
            setMessages((prev) => [...prev, ...newMessages]);
          }
          bufferedMessagesRef.current = [];
        }
      } catch (err) {
        setError('Unable to load chat history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [username, activeChatUser]);

  // ── Socket event listeners ──
  useEffect(() => {
    if (!username) return;

    const onNewMessage = (message) => {
      if (!message || !message._id) return;

      const isForActiveChat = 
        activeChatUser && (
          (message.username === activeChatUser && message.receiver === username) || 
          (message.username === username && message.receiver === activeChatUser)
        );

      // If it belongs to active chat but history hasn't loaded, buffer it
      if (isForActiveChat && !historyLoadedRef.current) {
        bufferedMessagesRef.current.push(message);
        return;
      }

      // If it belongs to active chat and isn't a duplicate, add it
      if (isForActiveChat && !messageIdsRef.current.has(message._id)) {
        messageIdsRef.current.add(message._id);
        setMessages((prev) => [...prev, message]);
      }

      // Always mark as delivered if from another user
      if (message.username !== username) {
        socket.emit('message_delivered', { messageIds: [message._id] });
        
        // Always play sound for incoming messages
        playNotificationSound();
        
        // Show browser desktop notification if app is not focused or if looking at another chat
        if (!document.hasFocus() || !isForActiveChat) {
          if ('Notification' in window && Notification.permission === 'granted') {
            const bodyText = message.content.length > 40 
              ? message.content.substring(0, 40) + '...' 
              : message.content;
              
            const notification = new Notification(`New message from ${message.username}`, {
              body: bodyText,
              icon: `${window.location.origin}/favicon.svg`
            });
            
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
          
          // Refresh contacts to update unread status / push to top
          fetchContacts();
        }
      }
    };

    const onOnlineUsers = () => {
      // The server no longer broadcasts this to everyone to prevent thundering herd.
      // We rely on user_joined and user_left for updates.
    };

    const onUserTyping = ({ username: typingUser }) => {
      if (typingUser === username) return;

      setTypingUsers((prev) => {
        if (prev.includes(typingUser)) return prev;
        return [...prev, typingUser];
      });
    };

    const onUserStopTyping = ({ username: typingUser }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typingUser));
    };

    const onUserJoined = ({ username: joinedUser }) => {
      setContacts((prev) => {
        const exists = prev.find(c => c.username === joinedUser);
        let newContacts;
        if (exists) {
          newContacts = prev.map(c => c.username === joinedUser ? { ...c, isOnline: true } : c);
        } else {
          newContacts = [...prev, { username: joinedUser, isOnline: true }];
        }
        return newContacts.sort((a, b) => {
          if (a.isOnline === b.isOnline) return a.username.localeCompare(b.username);
          return a.isOnline ? -1 : 1;
        });
      });
    };

    const onUserLeft = ({ username: leftUser }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== leftUser));
      setContacts((prev) => {
        return prev.map(c => c.username === leftUser ? { ...c, isOnline: false } : c).sort((a, b) => {
          if (a.isOnline === b.isOnline) return a.username.localeCompare(b.username);
          return a.isOnline ? -1 : 1;
        });
      });
    };

    const onStatusUpdate = ({ messageIds, status }) => {
      if (!messageIds || messageIds.length === 0) return;

      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, status } : msg
        )
      );
    };

    const onErrorMessage = ({ message }) => {
      setError(message);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    };

    socket.on('new_message', onNewMessage);
    socket.on('online_users', onOnlineUsers);
    socket.on('user_typing', onUserTyping);
    socket.on('user_stop_typing', onUserStopTyping);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('messages_status_update', onStatusUpdate);
    socket.on('error_message', onErrorMessage);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('online_users', onOnlineUsers);
      socket.off('user_typing', onUserTyping);
      socket.off('user_stop_typing', onUserStopTyping);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('messages_status_update', onStatusUpdate);
      socket.off('error_message', onErrorMessage);
    };
  }, [username, activeChatUser, fetchContacts]);

  // ── Send message via REST API ──
  const sendMessage = useCallback(
    async (content) => {
      if (!content || content.trim().length === 0 || !activeChatUser) return;
      if (!isConnected) {
        setError('Unable to send message. You are disconnected.');
        setTimeout(() => setError(null), 5000);
        return;
      }

      try {
        await sendMessageREST(username, activeChatUser, content.trim());
      } catch (err) {
        setError('Failed to send message via API. Please try again.');
        setTimeout(() => setError(null), 5000);
      }

      // Stop typing indicator
      if (isTypingRef.current) {
        socket.emit('typing_stop', { username, receiver: activeChatUser });
        isTypingRef.current = false;
      }
    },
    [username, isConnected, activeChatUser]
  );

  // ── Typing indicator with debounce ──
  const handleTyping = useCallback(() => {
    if (!isConnected || !activeChatUser) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', { username, receiver: activeChatUser });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit('typing_stop', { username, receiver: activeChatUser });
      }
    }, 2000);
  }, [username, isConnected, activeChatUser]);

  // ── Mark messages as read ──
  const markAsRead = useCallback(
    (messageIds) => {
      if (!isConnected || !messageIds || messageIds.length === 0) return;
      socket.emit('message_read', { messageIds });
    },
    [isConnected]
  );

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
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
  };
};

export default useChat;
