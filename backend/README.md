# SwellMind Backend

Node.js/Express API for the SwellMind surf recommendation app.

## Features

- 🌊 **Surf Forecasts**: Fetches marine weather data from Open-Meteo API
- 📊 **ML Scoring**: Personalized suitability scores for each surf window
- 📝 **Session Logging**: Log surf sessions with ratings and conditions
- 🔮 **Insights**: Learn what conditions you prefer over time
- 🔐 **Authentication**: Supabase Auth integration

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **ML**: ml-regression for linear regression
- **Validation**: Zod

## Setup

### 1. Prerequisites

- Node.js 18+
- A Supabase project ([create one free](https://supabase.com))

### 2. Database Setup

Run the schema in your Supabase SQL Editor:

```bash
# Run schema.sql first
cat ../db/schema.sql

# Then seed the spots
cat ../db/seed_spots.sql
```

### 3. Environment Variables

Copy the example and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

### 4. Install & Run

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

### Authentication

```
POST /auth/signup      - Create account
POST /auth/signin      - Sign in
POST /auth/signout     - Sign out
GET  /auth/me          - Get current user
PUT  /auth/me          - Update profile
DELETE /auth/me        - Delete account
POST /auth/me/spots    - Add favorite spot
DELETE /auth/me/spots/:id - Remove favorite spot
```

### Spots

```
GET /spots              - List all spots
GET /spots/:id          - Get spot details
GET /spots/:id/windows  - Get forecast windows (with ML scores if authenticated)
```

### Sessions

```
POST /sessions          - Log a surf session
GET  /sessions/me       - Get your sessions
PUT  /sessions/:id      - Update a session
DELETE /sessions/:id    - Delete a session
```

### Insights

```
GET /insights/me        - Get your ideal conditions and insights
```

## ML Scoring

The scoring system has 3 phases:

1. **Generic (0-2 sessions)**: Uses heuristics based on your preferences
2. **Blended (3-9 sessions)**: 50% generic + 50% learned from your data
3. **Learned (10+ sessions)**: Fully personalized to your ratings

Scores range from 0-100, with 75+ marked as "Recommended".

## Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Connect Railway to your repo
3. Set environment variables in Railway dashboard
4. Deploy!

Railway auto-deploys on every push to `main`.

## Development

```bash
# Type check
npx tsc --noEmit

# Run tests
npm test

# Lint
npm run lint
```

## License

MIT
