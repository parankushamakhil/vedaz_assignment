# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Express, Socket.io, and MongoDB. This project was built to fulfill the assignment requirements for a real-time messaging interface.

## 🚀 Features

- **Real-Time Communication**: Messages are delivered instantly using Socket.io without requiring a page refresh.
- **REST APIs**: Sending messages and fetching chat history is handled via standard Express REST APIs.
- **Chat History**: Previous messages are retrieved from the database when the application is refreshed.
- **Message Timestamps**: All messages display accurate timestamps.
- **Responsive UI**: A clean, user-friendly chat interface optimized for both desktop and mobile devices.

### Bonus Features Implemented
- Username-based login (dummy authentication).
- Real-time typing indicators.
- Online/offline user status.
- Message status indicators (Sent, Delivered, Read).
- Data persistence using MongoDB.

---

## 🛠️ Technology Stack

- **Frontend**: React (with Vite), CSS Modules
- **Backend**: Node.js, Express.js
- **Real-time Engine**: Socket.io
- **Database**: MongoDB (with Mongoose)

---

## ⚙️ Environment Variables

Before running the application, you need to set up your environment variables. 

### Backend (`server/.env`)
Create a `.env` file in the `server` directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realtime-chat
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
*(Note: You can replace the `MONGODB_URI` with your own MongoDB Atlas connection string).*

### Frontend (`client/.env`)
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 💻 Project Setup & Execution

### 1. Backend Setup (Node.js + Express)
Open your terminal and run the following commands:
```bash
cd server
npm install
npm run dev
```
*The backend server will start running on `http://localhost:5000`.*

### 2. Frontend Setup (React)
Open a **new** terminal window and run:
```bash
cd client
npm install
npm run dev
```
*The frontend application will open on `http://localhost:5173`.*

---

## 📐 Design Decisions

1. **Hybrid Architecture (REST + Socket.io)**: 
   - **REST API** (`POST /api/messages`) is used to formally send messages to the server, ensuring they are validated and saved to MongoDB.
   - **Socket.io** is used strictly as an event-driven broadcast mechanism (`io.emit`) to push the saved messages instantly to connected clients.
   - This approach perfectly satisfies the requirement to use REST APIs for sending messages while ensuring instant delivery via Sockets.
2. **Clean Architecture**: The backend is organized into distinct layers (`routes`, `controllers`, `services`, `models`, `sockets`) to separate business logic from network layers, making the code highly maintainable and reusable.
3. **CSS Modules**: Used for component-scoped styling to prevent class name collisions and keep the global namespace clean without relying on heavy external UI libraries.

---

## 🤔 Assumptions Made

1. **Dummy Authentication**: As per the bonus requirements, authentication is simplified to a "username-only" login system. There are no passwords or JWTs; entering a username establishes the session.
2. **1-on-1 Messaging**: The application is designed for private 1-on-1 chats rather than global group chat rooms.
3. **Online Status**: A user is considered "Online" as long as they have an active Socket.io WebSocket connection open.

---
