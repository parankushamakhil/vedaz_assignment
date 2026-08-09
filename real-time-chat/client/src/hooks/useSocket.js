import { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../services/socket';

/**
 * Custom hook for managing Socket.io connection lifecycle
 */
const useSocket = (username) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // connected | connecting | disconnected
  const hasJoined = useRef(false);

  const connect = useCallback(() => {
    if (!username) return;

    setConnectionStatus('connecting');

    if (!socket.connected) {
      socket.connect();
    }
  }, [username]);

  const disconnect = useCallback(() => {
    hasJoined.current = false;
    socket.disconnect();
  }, []);

  useEffect(() => {
    if (!username) return;

    const onConnect = () => {
      setIsConnected(true);
      setConnectionStatus('connected');

      // Join the chat room
      if (!hasJoined.current) {
        socket.emit('join_chat', { username });
        hasJoined.current = true;
      } else {
        // Reconnection — re-join
        socket.emit('join_chat', { username });
      }
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      hasJoined.current = false;
    };

    const onConnectError = (error) => {
      setConnectionStatus('disconnected');
      setIsConnected(false);
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('connecting');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    // Connect
    connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
    };
  }, [username, connect]);

  return {
    socket,
    isConnected,
    connectionStatus,
    connect,
    disconnect,
  };
};

export default useSocket;
