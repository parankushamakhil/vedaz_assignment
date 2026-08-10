import { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/Chat/ChatArea';
import styles from './Chat.module.css';

const Chat = () => {
  const { activeChatUser } = useChatContext();

  return (
    <div className={styles.chatPage}>
      <Header />
      <div className={styles.chatLayout}>
        <Sidebar className={activeChatUser ? styles.mobileHidden : ''} />
        <main className={`${styles.chatMain} ${!activeChatUser ? styles.mobileHidden : ''}`}>
          <ChatArea />
        </main>
      </div>
    </div>
  );
};

export default Chat;
