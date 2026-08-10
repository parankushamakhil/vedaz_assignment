import { useState, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import ConnectionStatus from '../Common/ConnectionStatus';
import styles from './Header.module.css';

const Header = () => {
  const { currentUser, connectionStatus, logout } = useChatContext();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <header className={styles.header} role="banner">
      <div className={styles.left}>

        <div className={styles.brand}>
          <div className={styles.brandIcon}>💬</div>
          <span className={styles.brandName}>RealTime Chat</span>
        </div>
      </div>

      <div className={styles.right}>
        <ConnectionStatus status={connectionStatus} />

        <div className={styles.userBadge}>
          <span className={styles.userAvatar}>
            {currentUser ? currentUser.charAt(0).toUpperCase() : '?'}
          </span>
          <span className={styles.userName}>{currentUser}</span>
        </div>

        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          id="theme-toggle-btn"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          <span className={styles.themeIcon}>{darkMode ? '☀️' : '🌙'}</span>
        </button>

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
