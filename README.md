# Pipeline Board 🚀

A real-time CI/CD status dashboard for GitHub Actions, built with FastAPI + React.


<img width="1886" height="953" alt="image" src="https://github.com/user-attachments/assets/febeb405-71c2-46ad-8a9d-c525e7773aff" />


## Features

- **Multi-repo tracking** — add any GitHub repo you have access to
- **Real-time updates** — WebSocket connection pushes pipeline changes instantly
- **GitHub webhook receiver** — GitHub notifies you the moment a run starts/completes
- **Dashboard** — success rate, avg duration, failing repos, area charts
- **Pipelines view** — filter by repo, branch, result
- **JWT auth** — register/login, secure endpoints
- **Sync on demand** — manually pull latest runs per repo

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| State | Zustand (auth), TanStack Query (server state) |
| Charts | Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose + passlib/bcrypt) |
| GitHub | REST API v3 + Webhooks |
| Real-time | WebSockets (native FastAPI) |

## Project Structure

```
cicd-board/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/         # config, database, security
│   │   ├── models/       # SQLAlchemy: User, Repo, Pipeline
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── routers/      # auth, repos, pipelines, webhooks, ws
│   │   └── services/     # github.py, ws_manager.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/          # axios client + all API calls
    │   ├── components/   # Sidebar, StatusBadge
    │   ├── hooks/        # useRealtimePipelines (WebSocket)
    │   ├── pages/        # Dashboard, Repos, Pipelines, Settings
    │   └── store/        # Zustand auth store
    ├── package.json
    └── tailwind.config.js
```

## Local Setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set a strong SECRET_KEY

uvicorn app.main:app --reload
# API at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

### 3. GitHub Token (required)

1. Register an account in the app
2. Go to Settings → paste a GitHub Personal Access Token
   - Scopes needed: `repo`, `workflow`
   - Create one at: https://github.com/settings/tokens/new

### 4. Add a Repo

Go to Repositories → enter `owner/repo-name` → click Add.
The app auto-syncs the last 30 runs.

## GitHub Webhooks (Real-time)

To receive real-time push updates from GitHub, expose your backend publicly (e.g. via ngrok in dev):

```bash
ngrok http 8000
# Your webhook URL: https://xxxx.ngrok.io/webhooks/github
```

Then in your GitHub repo → Settings → Webhooks → Add webhook:
- Payload URL: `https://your-url/webhooks/github`
- Content type: `application/json`
- Events: `Workflow runs`

## Deploying (Free)

| Service | What |
|---|---|
| **Vercel** | Frontend — connect GitHub repo, auto-deploys |
| **Render** | Backend — `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Neon** | PostgreSQL — set `DATABASE_URL` in Render env vars |

For PostgreSQL, change `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://user:pass@host/dbname
```
Remove the `connect_args` in `database.py` (that's SQLite-only).

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite or PostgreSQL connection string |
| `SECRET_KEY` | Random string for JWT signing (keep secret!) |
| `ALGORITHM` | `HS256` (default) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (default: 1440 = 24h) |

## What to Add Next

- [ ] Per-run job breakdown (call GitHub `/runs/{id}/jobs`)
- [ ] Email/Slack notifications on failure
- [ ] Build duration trend per repo
- [ ] GitHub OAuth login (instead of email/password)
- [ ] Role-based access (invite team members)
- [ ] Redis pub/sub for multi-server WebSocket scaling
