const express = require('express');
const router = express.Router();
const { getOnlineUsers, getContacts } = require('../controllers/userController');

router.get('/online', getOnlineUsers);
router.get('/contacts', getContacts);

module.exports = router;
