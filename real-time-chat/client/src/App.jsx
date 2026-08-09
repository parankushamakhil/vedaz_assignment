import { ChatProvider, useChatContext } from './context/ChatContext';
import Login from './pages/Login';
import Chat from './pages/Chat';
import './styles/globals.css';

const AppContent = () => {
  const { currentUser } = useChatContext();

  if (!currentUser) {
    return <Login />;
  }

  return <Chat />;
};

const App = () => {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
};

export default App;
