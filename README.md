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
- **Intersection Observer** - Efficient lazy loading of images

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM (Text Search enabled)
- **Wikipedia Action API** - Real-time data fetching
- **Wikidata API** - Structured metadata integration
- **JSON Web Tokens (JWT)** - Secure user authentication
- **Redis/In-Memory Cache** - Server-side caching strategy

### DevOps & Tools
- **GitHub Actions** - CI/CD pipeline for automated deployment
- **GitHub Pages** - Static site hosting
- **MongoDB Atlas** - Cloud database hosting
- **ESLint** - Code linting and quality assurance

## 📁 Project Architecture

```
diasporaecho/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── App/        # Main application component
│   │   │   ├── Echoes/     # Gallery with 3D Flip Cards
│   │   │   ├── Form/       # Authentication forms
│   │   │   └── Profile/    # User profile management
│   │   ├── contexts/       # React Context providers
│   │   ├── utils/          # Image optimization & API helpers
│   │   └── index.css       # Tailwind CSS imports
│   ├── public/             # Static assets
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
├── server/                 # Node.js Backend API
│   ├── controllers/        # Route handlers and business logic
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route definitions
│   ├── services/           # WikiService & FeaturedFiguresService
│   ├── config/             # Configuration files
│   └── app.js              # Express application setup
├── .github/workflows/      # GitHub Actions CI/CD
└── README.md
```

## 🔧 Key Features & Implementation

### 🌟 Interactive UI/UX
- **3D Flip Cards**: Hardware-accelerated CSS transforms enable interactive cards that flip on hover (3s delay) or manual click to reveal historical context.
- **Micro-Animations**: Smooth transitions, hover states, and glassmorphism effects using Tailwind utilities.
- **Smart Featured Figures**: Dynamic ranking algorithm that highlights figures based on **Likes**, **Views**, and **Search Hits**.
- **Responsive Layouts**: Mobile-first design with touch-friendly navigation and scrollable category tabs.

### 🔍 Advanced Search Architecture
- **Wikipedia-First Strategy**: Hybrid search engine that queries Wikipedia directly for "limitless" discovery, normalizing data on the fly.
- **Smart Categorization**: Automatically maps Wikidata occupations (e.g., "Suffragist") to project categories (e.g., "Activists & Freedom Fighters").
- **Local Fallback**: Seamlessly blends cached local data with real-time external results.

### ⚡ Performance Optimization
- **LCP Optimization**: "Eager Loading" strategy for above-the-fold content (`priority={true}`) ensures instant visual feedback.
- **Image Optimization Pipeline**: Regex-based utility intercepts Wikipedia URLs to request dynamic, optimized thumbnails (400px) instead of 5MB+ originals.
- **Lazy Loading**: `IntersectionObserver` defers loading of off-screen images until necessary.
- **Server Caching**: In-memory LRU caching prevents API rate limits and reduces latency.

### 🔐 Security & User Features
- **JWT Authentication**: Secure stateless session management.
- **Personal Collections**: Authenticated users can "Save" figures to their profile.
- **Optimistic UI**: "Like" and "Save" actions update instantly on the client for perceived speed.

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

## 🧪 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/users/me` - Get current user profile

### Figures
- `GET /api/figures?category=...` - Retrieve figures (supports pagination)
- `GET /api/figures/search?query=...` - Search Wikipedia & Local DB
- `GET /api/figures/:id` - Get specific figure details (auto-fetches from Wiki if missing)
- `POST /api/figures/:id/like` - Like a figure (authenticated)

### User Collections
- `GET /api/users/me/saved` - Get user's saved figures
- `POST /api/users/me/saved` - Save a figure to collection
- `DELETE /api/users/figures/:id` - Remove figure from collection

## 🚀 Deployment

The application uses a modern CI/CD pipeline:

1. **GitHub Actions** automatically builds and deploys the frontend to GitHub Pages
2. **Backend** deployed on Render/Railway
3. **Database** hosted on MongoDB Atlas cloud platform

## 👨‍💻 Developer

**Thursaun Canton**
- Portfolio: [https://Thursaun.github.io]
- LinkedIn: [linkedin.com/in/thursaun-c-3a381150/]
- Email: Thursaun.Canton@gmail.com

---

*Built with ❤️ to honor and celebrate the contributions of historical Black figures.*