const messageService = require('../services/messageService');
const { setOnlineUsersMap } = require('../controllers/userController');

// In-memory map: socketId -> { username, joinedAt }
const onlineUsers = new Map();
let ioInstance;

/**
 * Get deduplicated list of online users (one entry per username)
 */
const getOnlineUsersList = () => {
  const seen = new Set();
  const users = [];

  for (const [, userData] of onlineUsers) {
    if (!seen.has(userData.username)) {
      seen.add(userData.username);
      users.push({
        username: userData.username,
        joinedAt: userData.joinedAt,
      });
    }
  }

  return users;
};

/**
 * Count how many sockets a given username has
 */
const getSocketCountForUser = (username) => {
  let count = 0;
  for (const [, userData] of onlineUsers) {
    if (userData.username === username) count++;
  }
  return count;
};

/**
 * Validate a socket event payload
 */
const validatePayload = (data, requiredFields) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid payload' };
  }

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
      return { valid: false, error: `${field} is required` };
    }
  }

  return { valid: true };
};

/**
 * Initialize Socket.io event handlers
 */
const initializeChatSocket = (io) => {
  ioInstance = io;
  // Share the map with the user controller for REST API access
  setOnlineUsersMap(onlineUsers);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Join Chat ──
    socket.on('join_chat', (data) => {
      const validation = validatePayload(data, ['username']);
      if (!validation.valid) {
        socket.emit('error_message', { message: validation.error });
        return;
      }

      const username = data.username.trim();

      if (username.length < 2 || username.length > 30) {
        socket.emit('error_message', { message: 'Username must be between 2 and 30 characters' });
        return;
      }

      // Check if this is the user's first socket (before adding)
      const isFirstSocket = getSocketCountForUser(username) === 0;

      // Store user
      onlineUsers.set(socket.id, {
        username,
        joinedAt: new Date().toISOString(),
      });

      // Join a private room with their username for direct messaging
      socket.join(username);

      console.log(`User joined: ${username} (${socket.id})`);

      // Only broadcast user_joined if this is the user's first socket
      // (prevents ghost duplicate join events from multiple tabs)
      if (isFirstSocket) {
        socket.broadcast.emit('user_joined', {
          username,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ── Send Message ──
    socket.on('send_message', async (data) => {
      const validation = validatePayload(data, ['username', 'receiver', 'content']);
      if (!validation.valid) {
        socket.emit('error_message', { message: validation.error });
        return;
      }

      const username = data.username.trim();
      const receiver = data.receiver.trim();
      const content = data.content.trim();

      if (content.length === 0) {
        socket.emit('error_message', { message: 'Message content cannot be empty' });
        return;
      }

      if (content.length > 2000) {
        socket.emit('error_message', { message: 'Message cannot exceed 2000 characters' });
        return;
      }

      try {
        // Save to MongoDB
        const savedMessage = await messageService.createMessage(username, receiver, content);
        
        const messagePayload = {
          _id: savedMessage._id,
          username: savedMessage.username,
          receiver: savedMessage.receiver,
          content: savedMessage.content,
          messageType: savedMessage.messageType,
          status: savedMessage.status,
          createdAt: savedMessage.createdAt,
          updatedAt: savedMessage.updatedAt,
        };

        // Emit to the receiver's private room
        io.to(receiver).emit('new_message', messagePayload);
        
        // Emit back to the sender's room (so all their tabs get it)
        // If they send to themselves, io.to() handles duplicate prevention on frontend
        if (username !== receiver) {
          io.to(username).emit('new_message', messagePayload);
        }
      } catch (error) {
        console.error(`Error saving message: ${error.message}`);
        socket.emit('error_message', { message: 'Failed to send message. Please try again.' });
      }
    });

    // ── Typing Start ──
    socket.on('typing_start', (data) => {
      const user = onlineUsers.get(socket.id);
      if (!user || !data.receiver) return;

      socket.to(data.receiver).emit('user_typing', {
        username: user.username,
      });
    });

    // ── Typing Stop ──
    socket.on('typing_stop', (data) => {
      const user = onlineUsers.get(socket.id);
      if (!user || !data.receiver) return;

      socket.to(data.receiver).emit('user_stop_typing', {
        username: user.username,
      });
    });

    // ── Message Delivered ──
    socket.on('message_delivered', async (data) => {
      if (!data || !Array.isArray(data.messageIds) || !data.sender) return;

      const user = onlineUsers.get(socket.id);
      if (!user) return;

      try {
        await messageService.markMessagesDelivered(data.messageIds, user.username);

        // Notify only the original message sender's room (not broadcast)
        io.to(data.sender).emit('messages_status_update', {
          messageIds: data.messageIds,
          status: 'delivered',
          updatedBy: user.username,
        });
      } catch (error) {
        console.error(`Error updating delivery status: ${error.message}`);
      }
    });

    // ── Message Read ──
    socket.on('message_read', async (data) => {
      if (!data || !Array.isArray(data.messageIds) || !data.sender) return;

      const user = onlineUsers.get(socket.id);
      if (!user) return;

      try {
        await messageService.markMessagesRead(data.messageIds, user.username);

        // Notify only the original message sender's room (not broadcast)
        io.to(data.sender).emit('messages_status_update', {
          messageIds: data.messageIds,
          status: 'read',
          updatedBy: user.username,
        });
      } catch (error) {
        console.error(`Error updating read status: ${error.message}`);
      }
    });

    // ── Request Online Users (client can request a fresh list) ──
    socket.on('request_online_users', () => {
      socket.emit('online_users', getOnlineUsersList());
    });

    // ── Disconnect ──
    socket.on('disconnect', (reason) => {
      const user = onlineUsers.get(socket.id);

      if (user) {
        const username = user.username;
        console.log(`User disconnected: ${username} (${socket.id}) — ${reason}`);
        onlineUsers.delete(socket.id);

        // Only broadcast user_left if the user has NO remaining sockets
        // (prevents ghost offline status when user still has other tabs open)
        const remainingSockets = getSocketCountForUser(username);
        if (remainingSockets === 0) {
          socket.broadcast.emit('user_left', {
            username,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        console.log(`Socket disconnected: ${socket.id} — ${reason}`);
      }
    });

    // ── Error ──
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}: ${error.message}`);
    });
  });
};

/**
 * Emit a new message event to specific users
 */
const emitNewMessage = (receiver, sender, messagePayload) => {
  if (ioInstance) {
    // Emit to the receiver's private room
    ioInstance.to(receiver).emit('new_message', messagePayload);
    
    // Emit back to the sender's room (so all their tabs get it)
    if (sender !== receiver) {
      ioInstance.to(sender).emit('new_message', messagePayload);
    }
  }
};

module.exports = { initializeChatSocket, emitNewMessage };
