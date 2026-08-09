import { useState } from 'react';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import styles from './Chat.module.css';

const Chat = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.chatPage}>
      <Header onToggleSidebar={toggleSidebar} />
      <div className={styles.chatLayout}>
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className={styles.chatMain}>
          <ChatArea />
        </main>
      </div>
    </div>
  );
};

export default Chat;
