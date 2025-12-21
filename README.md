# GeoMaster 🌍

A real-time multiplayer geography quiz game where players compete to test their knowledge of flags, capitals, and country outlines.

## Project Overview

**GeoMaster** is a competitive geography quiz platform that enables users to host and join real-time multiplayer quiz rooms. Players answer timed questions about world geography, earn points based on speed and accuracy, and climb the leaderboard.

## Demo & Test Accounts

### Live Demo
- **Production**: [https://geomaster-tau.vercel.app](https://geomaster-tau.vercel.app)

### Test Accounts
```
Host Account:
Email: geomaster@test.com
Password: password123

Player Account:
Email: quizwhiz@test.com
Password: password123
```

### Key Features
- **Real-time Multiplayer**: Live game sessions with instant answer synchronization
- **Multiple Game Modes**: Test knowledge of flags, capitals, and country outlines
- **Host & Projector Mode**: Host can play along or run the game in projector mode for classroom/group settings
- **Leaderboard & Stats**: Track personal performance and compete globally
- **Answer Distribution**: See how other players answered after each round

### Domain
Educational gaming focused on geography education and competitive learning.

### User Roles
- **Player**: Join rooms, answer questions, track personal stats
- **Host**: Create rooms, configure game settings, start games, optionally play along

---

## Data Schema

### Models

**User**
- Core: `id`, `username`, `email`, `passwordHash`, `avatar`
- Stats: `totalScore`, `gamesPlayed`, `gamesWon`, `bestStreak`
- Category Stats: Per-type performance tracking (outline, capital, flag)

**Room**
- Core: `id`, `code`, `hostId`, `status` (WAITING, PLAYING, FINISHED)
- Config: `mode`, `type`, `difficulty`, `isHostPlaying`, `isRanked`
- Game State: `currentQuestionIndex`, `roundStartTime`
- Related: Array of `players`, array of `questions`

**Quiz**
- Core: `id`, `title`, `type`
- Content: Array of `questions`

**Question**
- Core: `questionText`, `imageUrl`, `options[]`, `correctAnswer`

**PlayerState** (Embedded in Room)
- Identity: `userId`, `username`, `avatar`
- Game State: `score`, `isReady`, `hasAnsweredCurrent`, `currentAnswer`, `streak`

### Key Relationships
- `Room.hostId` → `User.id` (one-to-one)
- `Room.players[]` → Array of player states referencing `User.id`
- `Room.questions[]` → Embedded from `Quiz.questions[]`

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local dev without Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone <repository-url>
cd geomaster

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:4000/graphql
```

### Environment Variables

Create `.env` files in respective directories:

**Backend (`/server/.env`)**
```env
MONGODB_URI=mongodb://localhost:27017/geomaster
JWT_SECRET=eW91ci1zZWNyZXQta2V5
PORT=4000
NODE_ENV=development
```

**Frontend (`/client/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
```

---

### Step-by-Step Real-time Test

1. **Open Two Browser Windows**
   - Window A: Host player
   - Window B: Guest player

2. **Register/Login Both Users**
   - Create two accounts (e.g., `host@test.com`, `guest@test.com`)

3. **Host Creates Room** (Window A)
   - Navigate to Dashboard
   - Click "Host Game"
   - Select game mode (e.g., "Flags")
   - Choose "Host Playing" mode
   - Click "Create Room"
   - Copy the 6-digit room code

4. **Guest Joins Room** (Window B)
   - Click "Join Room" on Dashboard
   - Enter the room code
   - Click "Enter Room"

5. **Verify Real-time Sync**
   - Both windows should show the waiting room
   - Both should see each other in the player list
   - Toggle ready status in Window B → Should update in Window A instantly

6. **Start the Game** (Window A - Host only)
   - Click "Start Game"
   - Both windows should transition to game screen simultaneously

7. **Test Answer Synchronization**
   - Answer a question in Window B
   - Window A should show checkmark next to guest's name
   - After all answer, both see answer distribution overlay
   - Both advance to next question automatically

8. **Test Leave Functionality**
   - Click "Leave Game" in Window B
   - Window A updates player list immediately
   - If host leaves with 0 players → Room deleted

---

## Available Scripts

### Backend Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Database
npm run seed         # Seed database with quiz questions

# Quality
npm test         # Run unit tests
```

### Frontend Scripts

```bash
# Development
npm run dev          # Start Next.js dev server
```

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Apollo Client (GraphQL + Subscriptions)
- Tailwind CSS + shadcn/ui
- Zustand (State Management)

**Backend**
- Node.js + Express
- Apollo Server (GraphQL)
- MongoDB + Mongoose
- GraphQL Subscriptions (PubSub)
- JWT Authentication

---

**Built with ❤️**