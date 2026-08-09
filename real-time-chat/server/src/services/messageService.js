const Message = require('../models/Message');

/**
 * Create and save a new message
 */
const createMessage = async (username, receiver, content) => {
  if (!username || !receiver || !content) {
    throw new Error('Sender, receiver, and content are required');
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    throw new Error('Message content cannot be empty');
  }

  if (trimmedContent.length > 2000) {
    throw new Error('Message cannot exceed 2000 characters');
  }

  const message = new Message({
    username: username.trim(),
    receiver: receiver.trim(),
    content: trimmedContent,
    messageType: 'text',
    status: 'sent',
  });

  const savedMessage = await message.save();
  return savedMessage;
};

/**
 * Fetch paginated messages sorted by creation time
 */
const getMessages = async (user1, user2, page = 1, limit = 50) => {
  if (!user1 || !user2) throw new Error('Both users are required to fetch private history');

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const query = {
    $or: [
      { username: user1, receiver: user2 },
      { username: user2, receiver: user1 }
    ]
  };

  const totalMessages = await Message.countDocuments(query);
  const totalPages = Math.ceil(totalMessages / limitNum);

  const messages = await Message.find(query)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    messages,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalMessages,
      limit: limitNum,
      hasMore: pageNum < totalPages,
    },
  };
};

/**
 * Fetch the latest N messages (used for initial load)
 */
const getLatestMessages = async (user1, user2, limit = 50) => {
  if (!user1 || !user2) return [];

  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const query = {
    $or: [
      { username: user1, receiver: user2 },
      { username: user2, receiver: user1 }
    ]
  };

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .lean();

  // Reverse so they appear in chronological order
  return messages.reverse();
};

/**
 * Update message delivery status
 */
const markMessagesDelivered = async (messageIds, username) => {
  if (!Array.isArray(messageIds) || messageIds.length === 0) return;

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      username: { $ne: username },
      deliveredTo: { $ne: username },
    },
    {
      $addToSet: { deliveredTo: username },
      $set: { status: 'delivered' },
    }
  );
};

/**
 * Update message read status
 */
const markMessagesRead = async (messageIds, username) => {
  if (!Array.isArray(messageIds) || messageIds.length === 0) return;

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      username: { $ne: username },
      readBy: { $ne: username },
    },
    {
      $addToSet: { readBy: username },
      $set: { status: 'read' },
    }
  );
};

/**
 * Fetch contacts (users you have chatted with)
 */
const getContacts = async (username) => {
  if (!username) return [];
  
  // Find all unique receivers you sent to, and senders who sent to you
  const sentTo = await Message.distinct('receiver', { username });
  const receivedFrom = await Message.distinct('username', { receiver: username });
  
  const allContacts = new Set([...sentTo, ...receivedFrom]);
  allContacts.delete(username); // Remove self just in case
  
  return Array.from(allContacts);
};

module.exports = {
  createMessage,
  getMessages,
  getLatestMessages,
  markMessagesDelivered,
  markMessagesRead,
  getContacts,
};
