# AI Email Management Application

A full-stack AI-powered email client that connects to **Gmail via Google OAuth 2.0**. Browse, search, and manage your real inbox — plus get AI-generated summaries and reply drafts.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup)
5. [Environment Variables](#env-vars)
6. [Running Locally](#running-locally)
7. [API Endpoints](#api-endpoints)
8. [Development Workflow](#dev-workflow)
9. [Testing](#testing)
10. [Production Deployment](#production)
11. [FAQ & Troubleshooting](#faq)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (App Router) · React · Tailwind CSS · Zustand · Axios · TanStack Query · lucide-react |
| **Backend** | Node.js · Express · MongoDB (Mongoose) · JWT · Helmet · CORS · Morgan · express-validator · express-rate-limit |
| **Auth** | Google OAuth 2.0 (server-side flow — tokens never reach the browser) |
| **AI** | Provider-agnostic service (OpenAI / Gemini / any compatible API) |
| **Background Jobs** | BullMQ + Redis *(optional — graceful fallback when unavailable)* |
| **Realtime** | Socket.IO |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js ≥ 20** (LTS) — [download](https://nodejs.org/)
- **npm** (bundled with Node.js)
- **MongoDB** — local install (`mongod`) **or** a [MongoDB Atlas](https://www.mongodb.com/atlas) URI
- **Git** — [download](https://git-scm.com/)

**Optional:**

- **Redis** — only required if you want BullMQ background jobs
- **Google Cloud project** — needed for Gmail OAuth (see [Step 4](#step-4-google-oauth) below)
- **AI provider API key** — e.g. OpenAI, Google Gemini

---

## Project Structure

```
Intelligent Email Assistant/
├── client/                  # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable UI components
│   │   ├── store/           # Zustand state stores
│   │   └── services/        # API client & Socket.IO
│   ├── .env.local           # Frontend env vars (public only)
│   └── package.json
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── config/          # env.js, db.js, socket.js
│   │   ├── routes/          # Express route definitions
│   │   ├── controllers/     # Thin request handlers
│   │   ├── services/        # Business logic layer
│   │   ├── integrations/    # Gmail API wrapper
│   │   ├── middleware/      # Auth, validation, errors, rate-limit
│   │   ├── models/          # Mongoose schemas
│   │   ├── queues/          # BullMQ workers (optional)
│   │   └── index.js         # Server entry point
│   ├── .env                 # Backend env vars (secrets)
│   ├── .env.example         # Template with placeholders
│   └── package.json
│
├── spec.md                  # Full project specification
└── README.md                # ← You are here
```

---

## Setup & Installation

### Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd "Intelligent Email Assistant"
```

### Step 2 — Install backend dependencies

```bash
cd server
npm install
```

### Step 3 — Install frontend dependencies

```bash
cd ../client
npm install
```

### Step 4 — Google OAuth Setup (for Gmail integration) <a name="step-4-google-oauth"></a>

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the **Gmail API** under "APIs & Services → Library"
4. Go to "APIs & Services → Credentials" → **Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:5000/api/gmail/oauth/callback`
5. Copy the **Client ID** and **Client Secret** into `server/.env`
6. Configure the **OAuth consent screen** (test mode is fine for development)

### Step 5 — Configure environment variables

```bash
cd ../server
cp .env.example .env
# Edit .env with your actual values (see table below)
```

```bash
cd ../client
cp .env.example .env.local
# Usually no changes needed for local dev
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `PORT` | `5000` | Express server port |
| `CLIENT_URL` | `http://localhost:3000` | Frontend origin (CORS) |
| `MONGODB_URI` | `mongodb://localhost:27017/email-assistant` | MongoDB connection string |
| `JWT_SECRET` | `change-me-to-random-string` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5000/api/gmail/oauth/callback` | Must match Google Console |
| `CREDENTIAL_ENCRYPTION_KEY` | 64-char hex string | AES-256 key for encrypting OAuth tokens |
| `AI_PROVIDER` | `openai` or `gemini` | AI provider identifier |
| `AI_API_KEY` | `sk-xxx` | Provider API key |
| `AI_MODEL` | `gpt-4o-mini` | Model name |
| `REDIS_URL` | `redis://localhost:6379` | *(Optional)* For BullMQ background jobs |

### Client (`client/.env.local`)

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

> ⚠️ **Never commit `.env` files.** Only `.env.example` with placeholders should be in version control.

---

## Running Locally

### 1. Start MongoDB

```bash
# If using local MongoDB:
mongod
# Or use MongoDB Atlas (just set MONGODB_URI in .env)
```

### 2. Start the backend server

```bash
cd server
npm run dev
```

You should see:
```
Server running on port 5000 [development]
MongoDB connected: localhost
```

### 3. Start the frontend

```bash
cd client
npm run dev
```

Open **http://localhost:3000** in your browser.

### Quick start (both together)

```bash
# From the project root, install concurrently globally:
npm install -g concurrently

# Then run:
concurrently "npm run dev --prefix server" "npm run dev --prefix client"
```

---

## API Endpoints

### Health & Auth
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/health` | System health check |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user profile |

### Gmail OAuth
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/gmail/oauth/start` | Start Google OAuth flow |
| GET | `/api/gmail/oauth/callback` | Google OAuth callback |
| GET | `/api/gmail/status` | Gmail connection status |
| POST | `/api/gmail/reconnect` | Reconnect Gmail |
| POST | `/api/gmail/disconnect` | Disconnect Gmail |

### Emails
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/emails` | List inbox messages |
| GET | `/api/emails/search` | Search emails |
| GET | `/api/emails/:id` | Get single email |
| POST | `/api/emails/:id/read` | Mark as read |
| POST | `/api/emails/:id/unread` | Mark as unread |
| POST | `/api/emails/:id/star` | Star message |
| DELETE | `/api/emails/:id/star` | Unstar message |
| POST | `/api/emails/:id/archive` | Archive message |
| DELETE | `/api/emails/:id` | Delete message |
| POST | `/api/emails/send` | Send new email |

### Threads
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/threads/:threadId` | Get full thread |
| POST | `/api/threads/:threadId/reply` | Reply to thread |

### AI
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/ai/summarize` | Summarize email/thread |
| POST | `/api/ai/generate-reply` | Generate AI reply draft |

### Drafts
| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/drafts` | Create draft |
| GET | `/api/drafts` | List drafts |
| PUT | `/api/drafts/:id` | Update draft |
| DELETE | `/api/drafts/:id` | Delete draft |
| POST | `/api/drafts/:id/send` | Send draft |

### Activity
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/activity` | List activity history |
| GET | `/api/activity/:id` | Get activity detail |

---

## Development Workflow

| Task | Command | Notes |
|------|---------|-------|
| Start backend (auto-restart) | `cd server && npm run dev` | Uses `nodemon` |
| Start frontend | `cd client && npm run dev` | Next.js dev server on :3000 |
| Add a new route | Create in `server/src/routes/`, register in `index.js` | Controller → Service pattern |
| Add a UI component | Create in `client/src/components/` | Use Zustand stores for state |
| Enable background jobs | Set `REDIS_URL` in `.env`, run `redis-server` | BullMQ auto-initializes |

---

## Testing

### Backend tests
```bash
cd server
npm install --save-dev jest supertest
npm test
```

### Frontend tests
```bash
cd client
npm test
```

---

## Production Deployment

1. **Build frontend:**
   ```bash
   cd client && npm run build && npm start
   ```

2. **Start backend:**
   ```bash
   cd server && npm start
   ```

3. Update all environment variables for production (real Google OAuth URIs, HTTPS, etc.)
4. Use a process manager (PM2) or containerize with Docker
5. Terminate TLS at your reverse proxy (NGINX, CloudFlare, etc.)

---

## FAQ & Troubleshooting

**Q: `npm run dev` fails with "Missing script: dev"**
A: Make sure you're in the `server/` or `client/` directory, not the project root.

**Q: MongoDB connection error**
A: Ensure MongoDB is running (`mongod`) or your Atlas URI is correct in `server/.env`.

**Q: "Gmail not connected" errors**
A: Complete the OAuth flow first — visit `/integrations` in the UI and click "Connect Gmail".

**Q: AI features return errors**
A: Check that `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` are set correctly in `server/.env`.

**Q: Redis not available**
A: That's fine! Background jobs fall back to synchronous execution. Redis is only needed for production-grade queue processing.

---

*Built with ❤️ following the [spec.md](./spec.md) specification.*
