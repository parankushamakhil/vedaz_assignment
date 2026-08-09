import styles from './ConnectionStatus.module.css';

const ConnectionStatus = ({ status }) => {
  const statusConfig = {
    connected: {
      label: 'Connected',
      className: styles.connected,
      indicator: styles.indicatorConnected,
    },
    connecting: {
      label: 'Connecting...',
      className: styles.connecting,
      indicator: styles.indicatorConnecting,
    },
    disconnected: {
      label: 'Disconnected',
      className: styles.disconnected,
      indicator: styles.indicatorDisconnected,
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <span
      className={`${styles.badge} ${config.className}`}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <span className={`${styles.indicator} ${config.indicator}`}></span>
      {config.label}
    </span>
  );
};

export default ConnectionStatus;
