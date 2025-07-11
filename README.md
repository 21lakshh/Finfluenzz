# 🎮 Finfluenzz

**Empowering Gen Z with Smart Finance - One Pixel at a Time**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-finfluenzz.vercel.app-007FFF?style=for-the-badge)](https://finfluenzz.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 About Finfluenzz

Finfluenzz is a cutting-edge fintech application designed specifically for Gen Z users, combining financial management with a retro gaming aesthetic. Our platform makes finance fun, accessible, and engaging through gamification, AI-powered insights, and modern UX design.

**🔗 Live Application:** [https://finfluenzz.vercel.app/](https://finfluenzz.vercel.app/)

### 🎯 Mission
To democratize financial literacy and empower the next generation with smart money management tools wrapped in an engaging, game-like experience.

## ✨ Features

### 🤖 AI Finance Advisor
- **Smart Investment Recommendations** powered by Groq AI
- **Real-time Stock Analysis** using Alpha Vantage APIs
- **🆕 Dual Chart Modes for Stocks** - Switch between candlestick patterns and 50-day trend analysis (stocks only)
- **🆕 Real-time Candlestick Charts** - Intraday minute-level data with pattern detection for stocks
- **🆕 Advanced Pattern Detection** - Identifies 15+ candlestick patterns (Doji, Spinning Top, Hammer, Engulfing, etc.)
- **🆕 Pattern Toggle Control** - Show/hide pattern symbols for clean chart analysis
- **🆕 Interactive Pattern Details** - Click patterns for detailed explanations and confidence scores
- **🆕 Crypto Chart Support** - Traditional price charts for cryptocurrency analysis (line charts only)
- **Personalized Financial Advice** based on user profile and goals
- **Enhanced Technical Indicators** including RSI, SMA20, SMA50, MACD calculations
- **Risk Assessment** and confidence scoring for investment decisions
- **🆕 Market Status Tracking** - Real-time US and Indian market hours monitoring

### 📈 Investment Zone
- **🆕 AI Portfolio Analysis** - Powered by Gemini API for comprehensive portfolio insights
- **🆕 Current Holdings Analysis** - Detailed breakdown of your investment positions
- **🆕 Portfolio Performance Metrics** - Risk assessment, diversification analysis, and recommendations
- **🆕 Smart Investment Insights** - AI-driven suggestions based on your current holdings
- **🆕 Portfolio Health Score** - Overall portfolio evaluation with actionable advice
- **🆕 Asset Allocation Analysis** - Sector and geographic diversification insights
- **🆕 Risk-Return Optimization** - Personalized recommendations for portfolio improvement

### 📰 News Terminal
- **🆕 Multi-source News Integration** - Finnhub API for comprehensive market coverage
- **🆕 Stock-specific News** - Company news filtered by symbol
- **🆕 Crypto News Coverage** - Dedicated cryptocurrency news section
- **🆕 Real-time News Feed** - Latest financial headlines with timestamps

### 💰 Budget Tracker
- **Real-time Expense Management** with CRUD operations
- **Smart Categorization** of expenses and income
- **Smart AI Summarizer** about Weekly/Monthly expenditure 

### 🏆 Gamified Challenges
- **Personalized Financial Challenges** based on spending patterns
- **Achievement System** with progress tracking
- **Weekly/Monthly Goals** for savings and budgeting

### 🔐 Secure Authentication
- **JWT-based Authentication** with refresh tokens
- **Protected Routes** and role-based access
- **Password Encryption** using bcrypt
- **Session Management** with automatic logout
- **🆕 Enhanced User Caching** - Improved session persistence

### 🎨 Retro Gaming UI
- **Pixel-perfect Design** inspired by classic arcade games
- **🆕 Enhanced Mobile Optimization** - Responsive charts and controls
- **🆕 Pattern Reference Tables** - Educational candlestick pattern guides
- **Responsive Layout** for all devices
- **Dark/Light Mode** support
- **Smooth Animations** and micro-interactions
- **Accessibility Features** for inclusive design

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **🆕 Lightweight Charts** - Professional trading chart library for candlestick visualization
- **Axios** - HTTP client for API requests
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icon library

### Backend
- **Cloudflare Workers** - Serverless edge computing
- **Hono Framework** - Lightweight web framework
- **Prisma ORM** - Type-safe database access
- **Neon PostgreSQL** - Serverless database
- **JWT** - Secure authentication tokens
- **bcrypt** - Password hashing

### APIs & Services
- **Groq AI** - Advanced language model for financial advice in Finance Advisor
- **🆕 Gemini AI** - Portfolio analysis and investment insights in Investment Zone
- **🆕 Alpha Vantage API** - Primary real-time stock data provider with intraday support
- **🆕 Finnhub API** - News integration and backup stock data
- **🆕 CoinGecko API** - Cryptocurrency data and historical pricing
- **Vercel** - Frontend deployment and hosting

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Git** - Version control
- **npm** - Package management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/finfluenzz.git
   cd finfluenzz
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd Finfluenzz/backend
   npm install
   ```

4. **Environment Setup**
   
   **Frontend (Create `.env` file in root):**
   ```env
   # Required for stock market data and real-time charts
   VITE_ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
   
   # Required for financial news terminal
   VITE_FINNHUB_API_KEY="your-finnhub-api-key"
   
   # Required for AI financial advisor
   VITE_GROQ_API_KEY="your-groq-api-key"
   
   # Optional: For enhanced portfolio analysis
   VITE_GEMINI_API_KEY="your-gemini-api-key"
   ```
   
   **Backend (Environmental Variables):**
   ```env
   DATABASE_URL="your-neon-postgresql-url"
   JWT_SECRET="your-jwt-secret-key"
   ```

### 🔑 API Key Setup Guide

#### Alpha Vantage (Required for Real-time Charts)
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for free API key (500 requests/day)
3. Add `VITE_ALPHA_VANTAGE_API_KEY` to your `.env` file

#### Finnhub (Required for News Terminal)
1. Visit [Finnhub](https://finnhub.io/)
2. Create free account (60 API calls/minute)
3. Add `VITE_FINNHUB_API_KEY` to your `.env` file

#### Groq (Required for AI Advisor)
1. Visit [Groq Console](https://console.groq.com/)
2. Create account and generate API key
3. Add `VITE_GROQ_API_KEY` to your `.env` file

#### Gemini (Required for Portfolio Analysis)
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create account and generate API key
3. Add `VITE_GEMINI_API_KEY` to your `.env` file

5. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start Development Servers**
   
   **Frontend:**
   ```bash
   npm run dev
   ```
   
   **Backend (if running locally):**
   ```bash
   cd backend
   npm run dev
   ```

7. **Open Application**
   Navigate to `http://localhost:5173` in your browser

## 📱 Usage

### Getting Started
1. **Sign Up** - Create your account with basic financial information
2. **Complete Profile** - Set your financial goals and preferences
3. **Explore Dashboard** - Navigate through different features using the sidebar
4. **Start Budgeting** - Add your first expenses and set budget goals
5. **🆕 Analyze Individual Assets** - Use Finance Advisor for real-time stock/crypto analysis with candlestick charts
6. **🆕 Analyze Your Portfolio** - Use Investment Zone for comprehensive portfolio analysis via Gemini AI
7. **🆕 Read Market News** - Stay updated with Finnhub news terminal
8. **Get AI Advice** - Chat with our finance advisor for personalized recommendations
9. **Take Challenges** - Complete gamified tasks to improve your financial habits 

### API Endpoints

#### Authentication
- `POST /api/signup` - User registration
- `POST /api/signin` - User login
- `GET /api/me` - Get current user profile

#### Expenses
- `GET /api/expense/all` - Get all user expenses
- `POST /api/expense/add` - Add new expense
- `DELETE /api/expense/delete/:id` - Delete expense

## 🎮 Gaming Elements

### User Progression
- **Levels** based on financial knowledge (Beginner → Player → Pro)
- **Progress Bars** showing completion of financial goals
- **Achievement Badges** for completing challenges
- **XP System** for consistent app usage

### Visual Design
- **Retro Pixel Art** aesthetic throughout the application
- **8-bit Color Palette** with blue (#007FFF) and navy (#001F3F) themes
- **Arcade-style Buttons** with hover effects and animations
- **🆕 Interactive Charts** with gaming-inspired UI elements
- **Pixelated Backgrounds** and floating elements

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using industry-standard bcrypt
- **Route Protection** preventing unauthorized access
- **Input Validation** and sanitization
- **CORS Configuration** for secure API access
- **Environment Variables** for sensitive data protection

## 🌐 Deployment

### Frontend (Vercel)
The application is deployed on Vercel with automatic builds from the main branch.

**Live URL:** [https://finfluenzz.vercel.app/](https://finfluenzz.vercel.app/)

### Backend (Cloudflare Workers)
The API is deployed on Cloudflare Workers for global edge distribution and optimal performance.

### 🆕 Production Environment Variables
Ensure these are configured in your deployment:
```env
VITE_ALPHA_VANTAGE_API_KEY="production-alpha-vantage-key"
VITE_FINNHUB_API_KEY="production-finnhub-key"
VITE_GROQ_API_KEY="production-groq-key"
VITE_GEMINI_API_KEY="production-gemini-key"
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Made with 💙 for Gen Z by Laksh**

*Empowering the next generation to take control of their financial future, one pixel at a time.*
