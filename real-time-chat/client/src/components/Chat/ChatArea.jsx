import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useChatContext } from '../../context/ChatContext';
import MessageBubble, { DateSeparator } from '../Message/MessageBubble';
import MessageInput from '../Input/MessageInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { formatDateLabel } from '../../utils/formatTime';
import styles from './ChatArea.module.css';

const ChatArea = () => {
  const {
    currentUser,
    messages,
    typingUsers,
    loading,
    error,
    isConnected,
    contacts,
    setError,
    markAsRead,
    activeChatUser,
  } = useChatContext();

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);

  // Check if user is near the bottom of the scroll (throttled)
  const lastScrollTime = useRef(0);
  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTime.current < 150) return; // Throttle to 150ms
    lastScrollTime.current = now;

    const container = containerRef.current;
    if (!container) return;

    const threshold = 100;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < threshold;
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    if (isNearBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Mark unread messages as read since we are at the bottom viewing them
      const unreadIds = messages
        .filter((m) => m.username !== currentUser && m.status !== 'read')
        .map((m) => m._id);
        
      if (unreadIds.length > 0) {
        // Use a small timeout to avoid emitting immediately on render
        setTimeout(() => markAsRead(unreadIds), 500);
      }
    }
  }, [messages, currentUser, markAsRead]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [loading]);

  // Messages with date separators
  const messagesWithDates = useMemo(() => {
    const result = [];
    let lastDate = null;

    messages.forEach((msg) => {
      const dateLabel = formatDateLabel(msg.createdAt);
      if (dateLabel !== lastDate) {
        result.push({ type: 'date', label: dateLabel, key: `date-${dateLabel}-${msg._id}` });
        lastDate = dateLabel;
      }
      result.push({ type: 'message', data: msg, key: msg._id });
    });

    return result;
  }, [messages]);

  // Typing indicator text
  const typingText = useMemo(() => {
    const filtered = typingUsers.filter((u) => u !== currentUser && u === activeChatUser);
    if (filtered.length === 0) return null;
    return 'typing...';
  }, [typingUsers, currentUser, activeChatUser]);

  // Find active user's online status
  const activeUserStatus = useMemo(() => {
    if (!activeChatUser) return null;
    const contact = contacts.find((c) => c.username === activeChatUser);
    return contact?.isOnline ? 'Online' : 'Offline';
  }, [activeChatUser, contacts]);

  if (!activeChatUser) {
    return (
      <div className={styles.chatAreaEmpty}>
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyIconPlaceholder}>💬</div>
          <h2>Your Messages</h2>
          <p>Select a contact from the sidebar to start a conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatArea}>
      {/* Chat header */}
      <div className={styles.chatHeader}>
        <button
          className={styles.backBtn}
          onClick={() => {
            // Unselect chat and open sidebar by triggering the header's toggle button
            setActiveChatUser(null);
            document.getElementById('toggle-sidebar-btn')?.click();
          }}
          aria-label="Back to chats"
        >
          ←
        </button>
        <div className={styles.chatHeaderInfo}>
          <h2 className={styles.chatTitle}>{activeChatUser}</h2>
          <p className={styles.chatSubtitle}>
            {activeUserStatus}
          </p>
        </div>
      </div>

      {/* Disconnected banner */}
      {!isConnected && (
        <div className={styles.disconnectedBanner}>
          Connection lost. Attempting to reconnect...
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '0 var(--space-lg)', paddingTop: 'var(--space-sm)' }}>
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Messages */}
      <div
        className={styles.messagesContainer}
        ref={containerRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {loading ? (
          <div className={styles.skeleton}>
            <div className={`${styles.skeletonBubble} ${styles.skeletonLeft}`}>
              <div className={styles.skeletonBlock}></div>
            </div>
            <div className={`${styles.skeletonBubble} ${styles.skeletonRight}`}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonBlockLarge}`}></div>
            </div>
            <div className={`${styles.skeletonBubble} ${styles.skeletonLeft}`}>
              <div className={styles.skeletonBlock}></div>
            </div>
            <div className={`${styles.skeletonBubble} ${styles.skeletonRight}`}>
              <div className={styles.skeletonBlock}></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👋</div>
            <h3 className={styles.emptyTitle}>No messages yet</h3>
            <p className={styles.emptySubtitle}>
              Start the conversation with {activeChatUser}!
            </p>
          </div>
        ) : (
          messagesWithDates.map((item) => {
            if (item.type === 'date') {
              return <DateSeparator key={item.key} label={item.label} />;
            }
            return (
              <MessageBubble
                key={item.key}
                message={item.data}
                isOwn={item.data.username === currentUser}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingText && (
        <div className={styles.typingIndicator}>
          <div className={styles.typingDots}>
            <span className={styles.typingDot}></span>
            <span className={styles.typingDot}></span>
            <span className={styles.typingDot}></span>
          </div>
          <span>{typingText}</span>
        </div>
      )}

      {/* Message input */}
      <MessageInput />
    </div>
  );
};

export default ChatArea;
