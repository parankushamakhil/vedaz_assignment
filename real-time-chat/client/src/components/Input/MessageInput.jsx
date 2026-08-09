import { useState, useRef, useCallback } from 'react';
import { useChatContext } from '../../context/ChatContext';
import styles from './MessageInput.module.css';

const MAX_LENGTH = 2000;

const MessageInput = () => {
  const { sendMessage, handleTyping, isConnected } = useChatContext();
  const [content, setContent] = useState('');
  const textAreaRef = useRef(null);

  const adjustTextAreaHeight = () => {
    const el = textAreaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_LENGTH) return;

    sendMessage(trimmed);
    setContent('');

    // Reset textarea height
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
    }
  }, [content, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setContent(value);
      handleTyping();
      adjustTextAreaHeight();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const trimmedLength = content.trim().length;
  const isDisabled = trimmedLength === 0 || !isConnected;

  return (
    <div className={styles.inputContainer}>
      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <textarea
          ref={textAreaRef}
          className={styles.textArea}
          placeholder={isConnected ? 'Type a message...' : 'Disconnected...'}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={!isConnected}
          aria-label="Message input"
          id="message-input"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={isDisabled}
          aria-label="Send message"
          id="send-message-btn"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style={{ marginLeft: '4px' }}>
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </form>
      {content.length > 1800 && (
        <div
          className={`${styles.charCounter} ${
            content.length > 1950 ? styles.charWarning : ''
          }`}
        >
          {content.length}/{MAX_LENGTH}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
