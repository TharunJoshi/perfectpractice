# PerfectPractice 🏏

> A Cricket Coaching Mobile App with AI-Powered Feedback

[![Expo](https://img.shields.io/badge/Expo-SDK%2052-blue)](https://expo.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com)

---

## 📱 About

PerfectPractice is a mobile application designed to help cricket players at all levels improve their skills through structured practice sessions, video analysis, and AI-powered feedback.

### Key Features
- **Anime-Style UI** - Beautiful dark theme with glowing effects
- **Social Authentication** - Login with Google, Meta, or Twitter (Demo Mode)
- **Practice Sessions** - Solo or Team practice with structured workflows
- **Reels** - Share and discover cricket training videos
- **ICC Guidelines** - Official cricket rules reference
- **AI Feedback** - Get insights on your technique (Coming Soon)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB
- Expo CLI

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd perfectpractice

# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure your environment
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend setup (new terminal)
cd frontend
yarn install
npx expo start
```

---

## 📸 Screenshots

| Login | Home | Reels |
|-------|------|-------|
| Anime-style login with social buttons | Side-by-side practice cards | Category-filtered video feed |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Expo App      │────▶│   FastAPI       │────▶│   MongoDB       │
│   (React Native)│     │   (Python)      │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tech Stack
- **Frontend**: Expo (React Native), TypeScript, Zustand, Expo Router
- **Backend**: FastAPI, Motor (async MongoDB), JWT Auth
- **Database**: MongoDB

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py        # API endpoints
│   ├── models.py        # Data models
│   └── requirements.txt
│
├── frontend/
│   ├── app/             # Screens (Expo Router)
│   │   ├── (tabs)/      # Tab navigation
│   │   ├── onboarding/  # Onboarding flow
│   │   └── session/     # Dynamic routes
│   ├── src/
│   │   ├── store/       # State management
│   │   ├── theme/       # UI theming
│   │   └── data/        # Static data
│   └── package.json
│
└── DEVELOPMENT_NOTES.md # Detailed documentation
```

---

## 🔌 API Reference

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/social` - Social login
- `POST /api/auth/onboarding` - Complete profile

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions` - List sessions
- `POST /api/sessions/{id}/join` - Join with code
- `POST /api/sessions/{id}/start` - Start session

### Reels
- `POST /api/reels/upload` - Upload video
- `GET /api/reels` - Public feed
- `POST /api/reels/{id}/like` - Like/unlike

---

## ✅ Status

### Implemented
- [x] User Authentication (Email + Social Demo)
- [x] Onboarding Flow
- [x] Home Dashboard
- [x] Practice Sessions
- [x] Reels Feed
- [x] ICC Guidelines

### In Progress
- [ ] Video Recording
- [ ] Video Trimming
- [ ] AI Shot Analysis

### Planned
- [ ] Real OAuth Integration
- [ ] Push Notifications
- [ ] Leaderboards

---

## 🧪 Testing

```bash
# Backend tests
python -m pytest

# The app has been tested with:
# - Backend API: 100% pass (24/24 tests)
# - Frontend UI: Verified on mobile (390x844)
```

---

## 📝 Documentation

For detailed development notes, see [DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT License](LICENSE)

---

## 👏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Backend powered by [FastAPI](https://fastapi.tiangolo.com)
- UI inspired by anime aesthetics

---

*Made with ❤️ for cricket lovers*
