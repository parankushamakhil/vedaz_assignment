import styles from './ErrorMessage.module.css';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className={styles.errorContainer} role="alert">
      <span className={styles.icon}>⚠️</span>
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
