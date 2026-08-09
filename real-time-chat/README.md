# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Express, Socket.io, and MongoDB. Users can join with a username, send and receive messages instantly, see who's online, and view typing indicators — all powered by WebSocket communication.

## Features

- **Real-time private messaging** — 1-on-1 WhatsApp style chat delivered instantly via Socket.io
- **Chat history** — Messages persisted in MongoDB and loaded on page refresh per contact
- **Contacts list** — Sidebar showing users you've chatted with and who's currently connected
- **Typing indicator** — See when someone is typing in your active chat (debounced)
- **Message status** — Sent (✓), Delivered (✓✓), Read (✓✓ green) indicators
- **Background Notifications** — Desktop notifications and Web Audio sounds when you receive a message while tab is unfocused
- **Responsive UI** — Beautiful, light Facebook-style theme with dynamic profile avatars
- **Message timestamps** — Every message shows formatted time
- **Auto-scroll** — Scrolls to latest message unless user has scrolled up
- **Input validation** — Both client and server validate all inputs
- **Session persistence** — Username remembered across page refreshes

## Technology Stack

### Frontend
- **React 19** — UI library with functional components and hooks
- **Vite** — Fast build tool and dev server
- **Socket.io-client** — WebSocket client for real-time communication
- **Axios** — HTTP client for REST API calls
- **CSS Modules** — Scoped component styling

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — Web framework for REST APIs
- **Socket.io** — WebSocket server for real-time events
- **MongoDB** — NoSQL database for message persistence
- **Mongoose** — MongoDB ODM with schema validation
- **Helmet** — Security headers
- **Morgan** — HTTP request logging
- **express-rate-limit** — API rate limiting
- **CORS** — Cross-origin resource sharing

## Architecture

```
React Client
 │
 ├── REST API (GET /api/messages) ──→ Express ──→ MongoDB   [Chat history]
 │
 └── Socket.io ──→ Node.js Server ──→ MongoDB ──→ Broadcast  [Real-time]
```

### Message Flow

**Initial Page Load:**
```
React → GET /api/messages → Express → MongoDB → Return history
```

**Sending a New Message (Socket.io — primary path):**
```
React → socket.emit('send_message') → Server validates → MongoDB save → io.emit('new_message') → All clients
```

**Why this architecture?**
- Socket.io is the **single path** for sending messages, which naturally prevents duplicate messages
- REST API is used only for fetching chat history on page load/refresh
- No race conditions between REST and Socket paths

## Project Structure

```
real-time-chat/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/ChatArea.jsx    # Message list, scroll, typing indicator
│   │   │   ├── Common/             # LoadingSpinner, ErrorMessage, ConnectionStatus
│   │   │   ├── Header/Header.jsx    # App header with status and logout
│   │   │   ├── Input/MessageInput.jsx # Message input with send button
│   │   │   ├── Message/MessageBubble.jsx # Individual message bubble
│   │   │   └── Sidebar/Sidebar.jsx  # Online users panel
│   │   ├── context/ChatContext.jsx  # React context for chat state
│   │   ├── hooks/
│   │   │   ├── useSocket.js         # Socket connection lifecycle
│   │   │   └── useChat.js           # Chat state and event management
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Username login screen
│   │   │   └── Chat.jsx             # Main chat layout
│   │   ├── services/
│   │   │   ├── api.js               # Axios-based REST API client
│   │   │   └── socket.js            # Socket.io client singleton
│   │   ├── styles/globals.css       # Design system and global styles
│   │   └── utils/formatTime.js      # Time formatting utilities
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── config/db.js             # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── messageController.js # Message API handlers
│   │   │   └── userController.js    # Online users API handler
│   │   ├── middleware/
│   │   │   ├── errorHandler.js      # Centralized error handling
│   │   │   └── notFound.js          # 404 handler
│   │   ├── models/
│   │   │   ├── Message.js           # Message Mongoose schema
│   │   │   └── User.js              # User Mongoose schema
│   │   ├── routes/
│   │   │   ├── messageRoutes.js     # Message REST routes
│   │   │   └── userRoutes.js        # User REST routes
│   │   ├── services/
│   │   │   └── messageService.js    # Message business logic
│   │   ├── sockets/
│   │   │   └── chatSocket.js        # Socket.io event handlers
│   │   ├── utils/response.js        # Response helpers
│   │   ├── app.js                   # Express app configuration
│   │   └── server.js                # HTTP server entry point
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json                     # Root scripts
└── README.md
```

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **MongoDB** — Local installation or [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud)
- **npm** (included with Node.js)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd real-time-chat
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

### 4. Configure environment variables

**Backend** — Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realtime-chat
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend** — Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Environment Variables

### Backend (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/realtime-chat` |
| `CLIENT_URL` | Allowed CORS origin (frontend URL) | `http://localhost:5173` |
| `NODE_ENV` | Environment (development/production) | `development` |

### Frontend (`client/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Backend Socket.io URL | `http://localhost:5000` |

## Running the Application

### Start MongoDB

```bash
# If using local MongoDB
mongod
```

### Start Backend

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`.

### Start Frontend

```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:5173`.

### Test with Multiple Users

1. Open `http://localhost:5173` in one browser tab → Enter username "Akhil"
2. Open `http://localhost:5173` in another tab or browser → Enter username "Sarah"
3. Send messages — they should appear instantly in both windows

## API Documentation

### Health Check

```http
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running"
}
```

### Fetch Messages

```http
GET /api/messages?limit=50&page=1
```

Response:
```json
{
  "success": true,
  "message": "Messages fetched successfully",
  "data": {
    "messages": [
      {
        "_id": "64f...",
        "username": "Akhil",
        "content": "Hello everyone!",
        "status": "sent",
        "createdAt": "2026-08-10T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalMessages": 1,
      "limit": 50,
      "hasMore": false
    }
  }
}
```

### Fetch Latest Messages (Initial Load)

```http
GET /api/messages?latest=true&limit=50
```

### Send Message (REST Fallback)

```http
POST /api/messages
Content-Type: application/json

{
  "username": "Akhil",
  "content": "Hello everyone!"
}
```

Response:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "_id": "64f...",
      "username": "Akhil",
      "content": "Hello everyone!",
      "status": "sent",
      "createdAt": "2026-08-10T10:30:00.000Z"
    }
  }
}
```

### Get Online Users

```http
GET /api/users/online
```

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_chat` | `{ username }` | Join the chat room |
| `send_message` | `{ username, content }` | Send a new message |
| `typing_start` | `{ username }` | User started typing |
| `typing_stop` | `{ username }` | User stopped typing |
| `message_delivered` | `{ messageIds: [] }` | Mark messages as delivered |
| `message_read` | `{ messageIds: [] }` | Mark messages as read |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ _id, username, content, status, createdAt }` | A new message was sent |
| `online_users` | `[{ username, joinedAt }]` | Updated list of online users |
| `user_typing` | `{ username }` | A user started typing |
| `user_stop_typing` | `{ username }` | A user stopped typing |
| `user_joined` | `{ username, timestamp }` | A new user joined |
| `user_left` | `{ username, timestamp }` | A user disconnected |
| `messages_status_update` | `{ messageIds, status }` | Message status changed |
| `error_message` | `{ message }` | Server-side error notification |

## Design Decisions

### Why Socket.io?
Socket.io provides reliable WebSocket communication with automatic fallback, reconnection, room support, and event-based messaging — ideal for real-time chat.

### Why MongoDB?
Document-oriented structure naturally fits chat messages. Schema flexibility, horizontal scaling, and built-in timestamps make it suitable for message persistence.

### Why REST for history, Socket.io for real-time?
- REST is stateless and cacheable — perfect for fetching historical data
- Socket.io provides persistent bidirectional connection — ideal for instant delivery
- Using Socket.io as the **sole send path** eliminates duplicate message issues

### How are duplicate messages prevented?
Messages are sent exclusively via Socket.io. The server saves to MongoDB and broadcasts to all clients (including sender). The frontend tracks message IDs in a Set and rejects duplicates.

### How are online users tracked?
An in-memory `Map<socketId, userData>` on the server tracks active Socket.io connections. This is more accurate than database-based tracking since it reflects actual connection state.

### How are race conditions handled?
Socket messages arriving during history loading are buffered. Once history loads, buffered messages are merged, deduplicating by `_id`.

## Assumptions

- Authentication is **dummy username-based** — no passwords required
- **1-on-1 private messaging** is implemented (users click a contact to chat privately)
- **Duplicate usernames are allowed** — multiple users can use the same name, but in a real app this would be unique
- MongoDB is responsible for **persistent message storage**
- Online status reflects **active Socket.io connections**, not database state
- Session is stored in **sessionStorage** (lost on browser close, preserved on refresh)

## Deployment (Recommended Strategy)

Based on modern best practices for React/Node apps:
- **Frontend:** Deploy to [Vercel](https://vercel.com) (Fastest, zero-config for React/Vite)
- **Backend:** Deploy to [Render](https://render.com) (Native WebSockets support, free tier available)

### Backend Deployment (Render / Railway / Fly.io)

1. Create a MongoDB Atlas database at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/realtime-chat`
3. Deploy the `server/` directory to your hosting platform
4. Set environment variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/realtime-chat
   CLIENT_URL=https://your-frontend-domain.com
   NODE_ENV=production
   ```

### Frontend Deployment (Vercel / Netlify)

1. Deploy the `client/` directory
2. Set environment variables:
   ```
   VITE_API_URL=https://your-backend-domain.com/api
   VITE_SOCKET_URL=https://your-backend-domain.com
   ```
3. Ensure CORS is configured on the backend to allow your frontend origin

### Verify Production Setup

1. Open the deployed frontend
2. Login with a username
3. Check connection status shows "Connected"
4. Open in another browser/device and test real-time messaging
5. Verify Socket.io WebSocket upgrade in browser DevTools → Network → WS

### Live URLs (Placeholder)

```
Live Frontend:  https://your-frontend-url.com
Live Backend:   https://your-backend-url.com
API:            https://your-backend-url.com/api
```

## Future Improvements

- JWT authentication with login/register
- Private direct messaging
- Group/channel chats
- File and image sharing
- Push notifications
- Message editing and deletion
- Message search
- Message reactions (emoji)
- User avatars and profiles
- Voice/video calling
- End-to-end encryption
- Message pagination with infinite scroll

## License

MIT
