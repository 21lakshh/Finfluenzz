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
- **Real-time Stock Analysis** using Alpha Vantage & Finnhub APIs
- **Live News Feed** with crypto and stock news integration
- **Personalized Financial Advice** based on user profile and goals
- **Technical Indicators** including RSI, SMA, MACD calculations
- **Risk Assessment** and confidence scoring for investment decisions

### 💰 Budget Tracker
- **Real-time Expense Management** with CRUD operations
- **Smart Categorization** of expenses and income
- **Visual Analytics** with charts and spending insights
- **Goal Setting** and progress tracking
- **Export Functionality** for financial records

### 🏆 Gamified Challenges
- **Personalized Financial Challenges** based on spending patterns
- **Achievement System** with progress tracking
- **Weekly/Monthly Goals** for savings and budgeting
- **Leaderboards** and social features (coming soon)

### 📈 Investment Zone
- **Live Stock Quotes** and market data
- **Portfolio Tracking** and performance analytics
- **Stock Search** and watchlist functionality
- **Historical Data** visualization with interactive charts
- **News Integration** for market updates

### 🔐 Secure Authentication
- **JWT-based Authentication** with refresh tokens
- **Protected Routes** and role-based access
- **Password Encryption** using bcrypt
- **Session Management** with automatic logout

### 🎨 Retro Gaming UI
- **Pixel-perfect Design** inspired by classic arcade games
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
- **Groq AI** - Advanced language model for financial advice
- **Alpha Vantage** - Stock market data and technical indicators
- **Finnhub** - Alternative stock data provider
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
   VITE_FINNHUB_API_KEY="your-finnhub-api-key"
   VITE_ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
   ```
   
   **Backend (Environmental Variables):**
   ```env
   DATABASE_URL="your-neon-postgresql-url"
   JWT_SECRET="your-jwt-secret-key"
   GROQ_API_KEY="your-groq-api-key"
   ALPHA_VANTAGE_API_KEY="your-alpha-vantage-key"
   FINNHUB_API_KEY="your-finnhub-api-key"
   ```

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
5. **Get AI Advice** - Chat with our finance advisor for personalized recommendations
6. **Take Challenges** - Complete gamified tasks to improve your financial habits

### API Endpoints

#### Authentication
- `POST /api/signup` - User registration
- `POST /api/signin` - User login
- `GET /api/me` - Get current user profile

#### Expenses
- `GET /api/expense/all` - Get all user expenses
- `POST /api/expense/add` - Add new expense
- `DELETE /api/expense/delete/:id` - Delete expense

#### Investment
- Stock data endpoints integrated with Alpha Vantage and Finnhub APIs
- Real-time quotes, historical data, and technical indicators

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

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Maintain the retro gaming aesthetic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for AI-powered financial insights
- **Alpha Vantage** for comprehensive stock market data
- **Neon** for reliable PostgreSQL hosting
- **Vercel** for seamless deployment
- **Cloudflare** for edge computing infrastructure
- **Gen Z Community** for inspiration and feedback

## 📞 Support

For support, questions, or feature requests:
- 🌐 **Website:** [https://finfluenzz.vercel.app/](https://finfluenzz.vercel.app/)
- 📧 **Email:** support@finfluenzz.com
- 💬 **Discord:** [Join our community](https://discord.gg/finfluenzz)

---

**Made with 💙 for Gen Z by Gen Z**

*Empowering the next generation to take control of their financial future, one pixel at a time.*
