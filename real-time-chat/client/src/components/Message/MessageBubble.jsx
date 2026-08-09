import { memo } from 'react';
import { formatTimestamp } from '../../utils/formatTime';
import styles from './MessageBubble.module.css';

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'read':
      return <span className={`${styles.statusIcon} ${styles.statusRead}`}>✓✓</span>;
    case 'delivered':
      return <span className={`${styles.statusIcon} ${styles.statusDelivered}`}>✓✓</span>;
    case 'sent':
    default:
      return <span className={`${styles.statusIcon} ${styles.statusSent}`}>✓</span>;
  }
};

const MessageBubble = ({ message, isOwn }) => {
  return (
    <div className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}>
      <div className={styles.bubble}>
        <div className={styles.bubbleInner}>
          <div className={styles.content}>{message.content}</div>
          <div className={styles.meta}>
            <span className={styles.timestamp}>
              {formatTimestamp(message.createdAt)}
            </span>
            {isOwn && <StatusIcon status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DateSeparator = ({ label }) => (
  <div className={styles.dateSeparator}>
    <span className={styles.dateLabel}>{label}</span>
  </div>
);

export default memo(MessageBubble);
