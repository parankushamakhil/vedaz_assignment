import { useState, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import styles from './Login.module.css';

const Login = () => {
  const { joinChat } = useChatContext();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const validate = (value) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return 'Username is required';
    if (trimmed.length < 2) return 'Username must be at least 2 characters';
    if (trimmed.length > 30) return 'Username cannot exceed 30 characters';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validate(username);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Request browser notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    joinChat(username);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 30) {
      setUsername(value);
      if (error) setError('');
    }
  };

  return (
    <div className={styles.loginPage}>
      <button
        className={styles.themeToggle}
        onClick={() => setDarkMode((prev) => !prev)}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        id="login-theme-toggle-btn"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>💬</div>
          <h1 className={styles.logoTitle}>RealTime Chat</h1>
          <p className={styles.logoSubtitle}>
            Connect and chat instantly with others
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="username" className={styles.label}>
              Enter your username
            </label>
            <input
              id="username"
              type="text"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="e.g. Akhil"
              value={username}
              onChange={handleChange}
              autoComplete="off"
              autoFocus
              maxLength={30}
              aria-describedby="username-error"
              aria-invalid={!!error}
            />
            <div className={styles.charCount}>
              {username.trim().length}/30
            </div>
            <div
              id="username-error"
              className={styles.validation}
              role="alert"
            >
              {error}
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={username.trim().length < 2}
            id="join-chat-btn"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
