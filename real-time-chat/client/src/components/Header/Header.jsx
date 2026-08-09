import { useChatContext } from '../../context/ChatContext';
import ConnectionStatus from '../Common/ConnectionStatus';
import styles from './Header.module.css';

const Header = ({ onToggleSidebar }) => {
  const { currentUser, connectionStatus, logout } = useChatContext();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          id="toggle-sidebar-btn"
        >
          ☰
        </button>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>💬</div>
          <span className={styles.brandName}>RealTime Chat</span>
        </div>
      </div>

      <div className={styles.right}>
        <ConnectionStatus status={connectionStatus} />
        <div className={styles.userInfo}>
          <span className={styles.userLabel}>Logged in as</span>
          <span className={styles.username}>{currentUser}</span>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={logout}
          aria-label="Logout"
          id="logout-btn"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
