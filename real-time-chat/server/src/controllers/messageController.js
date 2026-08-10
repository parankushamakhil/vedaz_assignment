const messageService = require('../services/messageService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * GET /api/messages
 * Fetch chat history with optional pagination
 */
const getMessages = async (req, res, next) => {
  try {
    const { page, limit, latest, username, withUser } = req.query;

    if (!username || !withUser) {
      return errorResponse(res, 'Both username and withUser are required to fetch private history', 400);
    }

    let result;
    if (latest) {
      const messages = await messageService.getLatestMessages(username, withUser, limit);
      result = { messages };
    } else {
      result = await messageService.getMessages(username, withUser, page, limit);
    }

    return successResponse(res, result, 'Messages fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/messages
 * Send a message via REST API (fallback/backup)
 */
const sendMessage = async (req, res, next) => {
  try {
    const { username, receiver, content } = req.body;

    if (!username || typeof username !== 'string') {
      return errorResponse(res, 'Sender username is required', 400);
    }

    if (!receiver || typeof receiver !== 'string') {
      return errorResponse(res, 'Receiver username is required', 400);
    }

    if (!content || typeof content !== 'string') {
      return errorResponse(res, 'Message content is required', 400);
    }

    if (username.trim().length < 2 || username.trim().length > 30) {
      return errorResponse(res, 'Sender username must be between 2 and 30 characters', 400);
    }

    if (content.trim().length === 0) {
      return errorResponse(res, 'Message content cannot be empty', 400);
    }

    if (content.trim().length > 2000) {
      return errorResponse(res, 'Message cannot exceed 2000 characters', 400);
    }

    const message = await messageService.createMessage(username.trim(), receiver.trim(), content.trim());

    // Broadcast the new message via Socket.io
    const { emitNewMessage } = require('../sockets/chatSocket');
    emitNewMessage(message.receiver, message.username, {
      _id: message._id,
      username: message.username,
      receiver: message.receiver,
      content: message.content,
      messageType: message.messageType,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    });

    return successResponse(res, { message }, 'Message sent successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = { getMessages, sendMessage };
