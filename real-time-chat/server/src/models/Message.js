const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Sender username is required'],
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    receiver: {
      type: String,
      required: [true, 'Receiver username is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    deliveredTo: [
      {
        type: String,
      },
    ],
    readBy: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fetching 1-on-1 history
messageSchema.index({ username: 1, receiver: 1, createdAt: 1 });
// Index for optimizing queries where user is the receiver (e.g. for '$or' history queries)
messageSchema.index({ receiver: 1, username: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
