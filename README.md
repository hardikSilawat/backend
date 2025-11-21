# DSA Sheet - MERN Stack Application

A comprehensive Data Structures and Algorithms learning platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## 🚀 Features

- **User Authentication**
  - Secure registration and login
  - JWT-based authentication
  - Protected routes

- **DSA Problem Management**
  - Topic-wise problem categorization
  - Subtopic organization
  - Difficulty levels (Easy, Medium, Hard)
  - Problem ordering and progression

- **Learning Resources**
  - YouTube tutorial links
  - LeetCode/Codeforces problem links
  - Article references

- **Progress Tracking**
  - Mark problems as completed
  - Track completion status
  - Resume progress on login

## 🛠 Tech Stack

- **Frontend**: React.js, Material-UI, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (MongoDB Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **API**: RESTful API design

## 📦 Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or yarn
- MongoDB (local or Atlas)

## 🚀 Getting Started

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the backend directory with:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=30d
   ```

3. **Start the backend server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd ../client
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

## 🌐 API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/logout` - Logout user

### Problems
- `GET /api/v1/problems` - Get all problems (grouped by topic/subtopic)
- `GET /api/v1/problems/:id` - Get single problem
- `GET /api/v1/problems/topic/:topic` - Get problems by topic
- `PUT /api/v1/problems/:id/complete` - Toggle problem completion
- `GET /api/v1/problems/completed` - Get user's completed problems

## 📁 Project Structure

```
backend/
├── config/           # Database and configuration
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/           # Database models
├── routes/           # API routes
├── utils/            # Utility functions
├── .env              # Environment variables
└── server.js         # Main application file
```

## 🔧 Development

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Testing**: `npm test`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- DSA problems curated from various coding platforms
- Built with the MERN stack
- Inspired by popular DSA sheets and coding platforms
