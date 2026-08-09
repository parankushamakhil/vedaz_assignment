const { successResponse, errorResponse } = require('../utils/response');
const messageService = require('../services/messageService');

// In-memory store reference — will be set by socket handler
let onlineUsersMap = new Map();

/**
 * Set the reference to the online users map (called from socket handler)
 */
const setOnlineUsersMap = (map) => {
  onlineUsersMap = map;
};

/**
 * GET /api/users/online
 * Returns the list of currently online users
 */
const getOnlineUsers = async (req, res, next) => {
  try {
    const users = [];
    const seen = new Set();

    for (const [, userData] of onlineUsersMap) {
      if (!seen.has(userData.username)) {
        seen.add(userData.username);
        users.push({
          username: userData.username,
          joinedAt: userData.joinedAt,
        });
      }
    }

    return successResponse(res, { users, count: users.length }, 'Online users fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/contacts
 * Returns the list of users this user has chatted with + currently online users
 */
const getContacts = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) {
      return errorResponse(res, 'Username is required', 400);
    }

    // Get historical contacts from database
    const historicalContacts = await messageService.getContacts(username);

    // Get currently online users
    const onlineUsers = [];
    const seen = new Set();
    for (const [, userData] of onlineUsersMap) {
      if (!seen.has(userData.username) && userData.username !== username) {
        seen.add(userData.username);
        onlineUsers.push(userData.username);
      }
    }

    // Merge them and remove duplicates
    const allContactsSet = new Set([...historicalContacts, ...onlineUsers]);
    
    // Format them with online status
    const contacts = Array.from(allContactsSet)
      .filter(contactUsername => contactUsername && contactUsername.trim() !== '')
      .map((contactUsername) => ({
      username: contactUsername,
      isOnline: seen.has(contactUsername),
    }));

    // Sort: Online first, then alphabetical
    contacts.sort((a, b) => {
      if (a.isOnline === b.isOnline) {
        return a.username.localeCompare(b.username);
      }
      return a.isOnline ? -1 : 1;
    });

    return successResponse(res, { contacts, count: contacts.length }, 'Contacts fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { getOnlineUsers, getContacts, setOnlineUsersMap };
