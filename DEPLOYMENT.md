# Earnly Deployment Guide

This repository is deployed as two separate Vercel projects from one GitHub repo:

- `earnly_backend` for the Python/FastAPI API
- `earnly_frontend` for the React/Vite web app

Do not put real secret values in committed files. Use placeholders in documentation and set real values only in local `.env` files or Vercel Environment Variables.

## 1. Deploy the backend first

1. Open the Vercel dashboard.
2. Click **Add New...** then **Project**.
3. Import the GitHub repository containing the `Earnly_Web` root.
4. Set **Root Directory** to:

```text
earnly_backend
```

5. Confirm the Python entrypoint is:

```text
api/index.py
```

6. Add these backend environment variables in Vercel:

```bash
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
CORS_ALLOWED_ORIGINS=http://localhost:5173
ENVIRONMENT=production
```

At this stage the production frontend URL does not exist yet, so `CORS_ALLOWED_ORIGINS` only includes the local frontend URL. You will update it after the frontend deploys.

7. Deploy the backend project.
8. Copy the deployed backend URL from Vercel. It will look like:

```text
https://earnly-backend-xxxxx.vercel.app
```

The API base URL is the backend URL plus `/api`:

```text
https://earnly-backend-xxxxx.vercel.app/api
```

9. Test the backend health endpoint:

```bash
curl https://earnly-backend-xxxxx.vercel.app/api/health
```

Expected response:

```json
{"status":"ok"}
```

## 2. Deploy the frontend second

1. Open the Vercel dashboard.
2. Click **Add New...** then **Project**.
3. Import the same GitHub repository.
4. Set **Root Directory** to:

```text
earnly_frontend
```

5. Use these frontend build settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

6. Add these frontend environment variables in Vercel:

```bash
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_BASE_URL=<your-deployed-backend-url>/api
```

Example shape only:

```bash
VITE_API_BASE_URL=https://earnly-backend-xxxxx.vercel.app/api
```

7. Deploy the frontend project.
8. Copy the deployed frontend URL from Vercel. It will look like:

```text
https://earnly-frontend-xxxxx.vercel.app
```

## 3. Update backend CORS and redeploy backend

After the frontend production URL exists, return to the backend Vercel project and update:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://earnly-frontend-xxxxx.vercel.app
```

Then redeploy the backend project so the API accepts requests from the deployed frontend.

## 4. Update Supabase Authentication URL Configuration

In the Supabase dashboard:

1. Go to **Authentication**.
2. Open **URL Configuration**.
3. Set **Site URL** to the deployed frontend URL:

```text
https://earnly-frontend-xxxxx.vercel.app
```

4. Add a redirect URL wildcard for the deployed frontend:

```text
https://earnly-frontend-xxxxx.vercel.app/**
```

This is required for production signup, login redirects, and password reset links.

## 5. Confirm the Supabase schema exists

Before production testing, run this migration in the Supabase SQL editor if you have not already:

```text
earnly_backend/supabase/migrations/001_initial_schema.sql
```

The app needs the `profiles`, `jobs`, and `shift_entries` tables and their RLS policies.

## 6. Post-deploy test checklist

1. Open the deployed frontend URL.
2. Sign up with a test account.
3. Confirm the email if Supabase requires confirmation.
4. Log in.
5. Complete “Set up your first job”.
6. Confirm a row appears in the Supabase `jobs` table.
7. Add or edit a weekly shift entry.
8. Confirm a row appears in the Supabase `shift_entries` table.
9. Test forgot password and password reset.
10. Refresh the app and confirm data persists.

## 7. Local verification commands

Frontend build:

```bash
cd earnly_frontend
npm run build
```

Backend syntax check:

```bash
cd earnly_backend
python3 -m py_compile $(find api -name '*.py' -print)
```
