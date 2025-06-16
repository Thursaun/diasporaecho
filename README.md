# Diaspora Echo

A modern full-stack web application celebrating the contributions of historical Black figures and their impact on society. Built with React and Node.js, Diaspora Echo provides an educational platform to discover overlooked historical figures through an intuitive, responsive interface.

## 🚀 Live Demo

- **Frontend**: [https://thursaun.github.io/diasporaecho/]
- **API Documentation**: Available upon request

## 🛠️ Technology Stack

### Frontend
- **React 18** - Component-based UI library with Hooks
- **React Router DOM** - Client-side routing and navigation
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Context API** - State management for user authentication
- **Fetch API** - HTTP client for backend communication

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JSON Web Tokens (JWT)** - Secure user authentication
- **bcryptjs** - Password hashing and security
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting

### DevOps & Tools
- **GitHub Actions** - CI/CD pipeline for automated deployment
- **GitHub Pages** - Static site hosting
- **MongoDB Atlas** - Cloud database hosting
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting

## 📁 Project Architecture

```
diasporaecho/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── App/        # Main application component
│   │   │   ├── Echoes/     # Figure gallery and detail views
│   │   │   ├── Form/       # Authentication forms
│   │   │   └── Profile/    # User profile management
│   │   ├── contexts/       # React Context providers
│   │   ├── utils/          # API utilities and constants
│   │   └── index.css       # Tailwind CSS imports
│   ├── public/             # Static assets
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
├── server/                 # Node.js Backend API
│   ├── controllers/        # Route handlers and business logic
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route definitions
│   ├── middlewares/        # Custom middleware functions
│   ├── services/           # External API integrations
│   ├── config/             # Configuration files
│   └── app.js              # Express application setup
├── .github/workflows/      # GitHub Actions CI/CD
└── README.md
```

## 🔧 Key Features & Implementation

### React Features Demonstrated
- **Functional Components with Hooks** - useState, useEffect, useContext
- **Custom Hooks** - Reusable logic for API calls and authentication
- **Context API** - Global state management for user authentication
- **React Router** - SPA navigation with protected routes
- **Conditional Rendering** - Dynamic UI based on authentication state
- **Component Composition** - Modular, reusable component architecture
- **Event Handling** - User interactions and form submissions
- **Props & State Management** - Data flow and component communication

### Backend Features
- **RESTful API Design** - CRUD operations for users and figures
- **JWT Authentication** - Secure user sessions
- **MongoDB Integration** - Document-based data storage
- **Input Validation** - Request validation and sanitization
- **Error Handling** - Comprehensive error management
- **Security Implementation** - CORS, Helmet, rate limiting

### User Experience
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Search & Filter** - Dynamic content discovery
- **User Authentication** - Secure registration and login
- **Personal Collections** - Save and organize favorite figures
- **Interactive UI** - Like system and user engagement features

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v8+)
- MongoDB Atlas account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/diasporaecho.git
cd diasporaecho
```

2. **Install frontend dependencies**
```bash
cd client
npm install
```

3. **Install backend dependencies**
```bash
cd ../server
npm install
```

4. **Environment Configuration**

Create `.env` file in the server directory:
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/diasporaecho
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

5. **Start development servers**

Backend:
```bash
cd server
npm run dev
```

Frontend (new terminal):
```bash
cd client
npm run dev
```

Application runs at:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

## 🧪 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/users/me` - Get current user profile

### Figures
- `GET /api/figures` - Retrieve all historical figures
- `GET /api/figures/search` - Search figures by query
- `GET /api/figures/:id` - Get specific figure details
- `POST /api/figures/:id/like` - Like a figure (authenticated)

### User Collections
- `GET /api/users/me/saved` - Get user's saved figures
- `POST /api/users/me/saved` - Save a figure to collection
- `DELETE /api/users/figures/:id` - Remove figure from collection

## 🎯 Technical Highlights

### React Best Practices
- Component-based architecture with clear separation of concerns
- Custom hooks for API integration and state management
- Context API for global state without prop drilling
- Conditional rendering for dynamic user experiences
- Form handling with controlled components

### Performance Optimizations
- Vite for fast development and optimized builds
- Code splitting with React.lazy (if implemented)
- Efficient re-rendering with proper dependency arrays
- Responsive images and lazy loading

### Security Implementation
- JWT-based authentication with secure token storage
- Input validation and sanitization
- CORS configuration for secure cross-origin requests
- Rate limiting to prevent API abuse
- Password hashing with bcrypt

## 🚀 Deployment

The application uses a modern CI/CD pipeline:

1. **GitHub Actions** automatically builds and deploys the frontend to GitHub Pages
2. **Backend** can be deployed to services like Railway, Render, or Vercel
3. **Database** hosted on MongoDB Atlas cloud platform

## 💡 Future Enhancements

- [ ] Advanced search with filters (time period, category, location)
- [ ] User comments and reviews system
- [ ] Social sharing capabilities
- [ ] Progressive Web App (PWA) features
- [ ] Internationalization (i18n) support
- [ ] Unit and integration testing with Jest/React Testing Library

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 👨‍💻 Developer

**Thursaun Canton**
- Portfolio: [https://Thursaun.github.io]
- LinkedIn: [linkedin.com/in/thursaun-c-3a381150/]
- Email: Thursaun.Canton@gmail.com

---

*Built with ❤️ to honor and celebrate the contributions of historical Black figures.*