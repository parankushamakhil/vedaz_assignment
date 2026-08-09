import { useChatContext } from '../../context/ChatContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { contacts, currentUser, activeChatUser, setActiveChatUser } = useChatContext();

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const getAvatarColor = (name) => {
    if (!name) return 'var(--bg-surface)';
    const colors = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#f39c12', '#d35400', '#c0392b'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        role="complementary"
        aria-label="Online users"
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.title}>
            Chats
          </h2>
        </div>

        <div className={styles.usersList}>
          {contacts.length === 0 ? (
            <div className={styles.emptyUsers}>No recent chats</div>
          ) : (
            contacts.map((user) => (
              <div
                className={`${styles.userItem} ${
                  activeChatUser === user.username ? styles.activeUserItem : ''
                }`}
                key={user.username}
                onClick={() => {
                  setActiveChatUser(user.username);
                  if (onClose) onClose();
                }}
                role="button"
                tabIndex={0}
              >
                {user.isOnline && <span className={styles.onlineIndicator}></span>}
                <div 
                  className={styles.avatar} 
                  style={{ backgroundColor: getAvatarColor(user.username), color: '#ffffff' }}
                >
                  {getInitial(user.username)}
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.username}</span>
                  <span className={styles.statusText}>
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
