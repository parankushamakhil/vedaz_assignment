import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className={styles.spinner} role="status" aria-label={message}>
      <div className={styles.spinnerDots}>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
        <span className={styles.dot}></span>
      </div>
      {message && <span>{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
