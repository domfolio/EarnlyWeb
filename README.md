# Earnly Web

Earnly is a full-stack income tracker for international students in Australia who work part-time or casual jobs. The project is now split into separate frontend and backend folders.

## Folder structure

```text
Earnly_Web/
├─ earnly_frontend/          React + Vite app
│  ├─ index.html
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ vite.config.js
│  ├─ vercel.json
│  ├─ .env.example
│  └─ src/
└─ earnly_backend/           Python API + Supabase schema
   ├─ requirements.txt
   ├─ vercel.json
   ├─ .env.example
   ├─ api/
   └─ supabase/migrations/
```

## Stack

- **Frontend:** React + Vite
- **Backend:** Python FastAPI-style API
- **Auth/Database:** Supabase Auth + Supabase Postgres
- **Deployment:** Vercel, preferably as two projects using separate root directories

## Frontend setup

```bash
cd earnly_frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend environment variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=/api
```

For separate production deployments, set `VITE_API_BASE_URL` to the deployed backend URL, for example:

```bash
VITE_API_BASE_URL=https://earnly-backend.vercel.app/api
```

The frontend dev server proxies `/api` to `http://localhost:8000` via `earnly_frontend/vite.config.js`.

## Backend setup

```bash
cd earnly_backend
cp .env.example .env.local
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.app.main:app --reload --port 8000
```

Backend environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.vercel.app
ENVIRONMENT=development
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

## Supabase setup

1. Create a Supabase project.
2. Enable Email Auth.
3. Add redirect URLs for local and deployed frontend URLs, including `/reset-password`.
4. Run `earnly_backend/supabase/migrations/001_initial_schema.sql` in Supabase.
5. Confirm Row Level Security is enabled for `profiles`, `jobs`, and `shift_entries`.

## Verification

Frontend:

```bash
cd earnly_frontend
npm run build
```

Backend:

```bash
cd earnly_backend
python3 -m py_compile $(find api -name '*.py' -print)
```

## Vercel deployment

Recommended setup is two Vercel projects:

- **Frontend project**
  - Root directory: `earnly_frontend`
  - Framework preset: Vite
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment variables: frontend `VITE_*` values

- **Backend project**
  - Root directory: `earnly_backend`
  - Python API source: `api/index.py`
  - Environment variables: backend `SUPABASE_*`, `CORS_ALLOWED_ORIGINS`, `ENVIRONMENT`

Update the frontend production `VITE_API_BASE_URL` to point to the backend deployment URL.
