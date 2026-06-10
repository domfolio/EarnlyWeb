# Cline Prompts — Earnly Web (Assignment 3)

These prompts take the existing React + Vite MVP (mock auth, `localStorage`) and turn it into the
deployed full-stack app the assessment requires: **React frontend + Python backend + Supabase
database + Vercel deployment**, with credentials in environment variables and everything on GitHub.

Feed them to Cline one at a time, in order. Wait for each step to finish and skim the diff before
continuing. **Keep a copy of every prompt you actually use** — the assessment requires a prompt
appendix, and this file can become it.

---

## Prompt 1 — Orient Cline and agree a plan (no code changes yet)

```
Before writing any code, read the existing project so you understand it.

Read README.md, package.json, vite.config.js, src/App.jsx, and every file under src/pages and
src/components. Earnly is a React + Vite income tracker for international students in Australia. Right
now authentication is mocked and all data is stored in the browser via localStorage (see App.jsx
STORAGE_KEY).

I need to evolve this into a full-stack app for an assessment. The required end state is:
- React frontend (keep the existing UI/screens working)
- A Python backend
- A Supabase (Postgres) database that persistently stores and retrieves user-submitted data
- Deployed on Vercel, with the frontend and Python backend in ONE GitHub repo
- Supabase API keys / DB connection strings stored ONLY as environment variables, never hardcoded
  and never exposed in frontend code

Do not change any code yet. Instead, produce a short plan:
1. The folder structure you propose (frontend at repo root, Python backend under /api as Vercel
   Python serverless functions).
2. The data model: which Supabase tables we need (users, jobs, weekly entries) and their columns,
   based on what the current localStorage data actually stores.
3. Which screens currently read/write localStorage and will need to call the backend instead.
4. The list of environment variables we will introduce and where each is used (frontend vs backend).

Show me the plan and wait for my approval before coding.
```

---

## Prompt 2 — Repo structure, .gitignore, and env scaffolding

```
Good. Now set up the project skeleton without breaking the existing frontend.

1. Create a /api folder at the repo root for the Python backend (Vercel Python serverless functions).
2. Add api/requirements.txt with: fastapi, supabase, python-dotenv, and any deps you need.
3. Create a .gitignore at the repo root that excludes: node_modules, dist, .env, .env.*,
   .vercel, __pycache__/, *.pyc, and any virtualenv folders. Make sure .env files can NEVER be
   committed.
4. Create a .env.example file (committed) listing every env var name with placeholder values and a
   comment explaining each — but NO real secrets. Include:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY (backend only)
   - VITE_API_BASE_URL (frontend, points to the backend)
5. Update README.md with a short "Architecture" section (React frontend, Python backend on Vercel,
   Supabase database) and "Local setup" / "Environment variables" instructions.

Do not put any real credentials anywhere. Show me the files when done.
```

---

## Prompt 3 — Supabase schema

```
Create the Supabase database schema as a SQL file I can paste into the Supabase SQL editor.

Add a file supabase/schema.sql that creates the tables from the plan (users, jobs, weekly entries),
based on the shape of the current localStorage data in App.jsx. Requirements:
- Use Postgres types (uuid primary keys with gen_random_uuid(), timestamptz for created_at).
- A jobs table linked to a user, and a weekly entries table linked to a job (foreign keys, on
  delete cascade), so each job keeps its own independent entries and notes like the current app.
- Store hourly rate, start time, end time, break time, calculated daily/weekly pay, day-of-week,
  and notes as appropriate.
- Add helpful comments above each table.

Do not run anything against a live database. Just generate the SQL file and explain what I need to
paste into Supabase.
```

---

## Prompt 4 — Python backend (FastAPI on Vercel)

```
Now build the Python backend under /api as a FastAPI app that runs as a Vercel Python serverless
function.

Requirements:
- Connect to Supabase using the official supabase Python client. Read SUPABASE_URL and
  SUPABASE_SERVICE_ROLE_KEY from environment variables via os.environ — NEVER hardcode them.
- Use python-dotenv so it also works locally from a .env file (which is gitignored).
- Expose JSON REST endpoints for the data the app needs: list/create/update/delete jobs, and
  list/create/update/delete weekly entries for a job, plus a simple signup/login endpoint that
  stores and checks users in Supabase. Keep auth simple but do not store plain-text passwords —
  hash them.
- Enable CORS so the deployed frontend can call the API.
- Structure it so Vercel can serve it: a single entrypoint (e.g. api/index.py) exposing the FastAPI
  app, and add a vercel.json at the repo root that builds the Vite frontend as a static site and
  routes /api/* to the Python function.
- Validate inputs and return clear error messages.

Walk me through every new file and tell me exactly which environment variables I must set in Vercel
and in my local .env.
```

---

## Prompt 5 — Wire the React frontend to the backend

```
Replace the localStorage data layer in the frontend with calls to the Python backend, keeping all
existing screens working.

1. Create a small API client module (e.g. src/utils/api.js) that reads the backend base URL from
   import.meta.env.VITE_API_BASE_URL and has functions for each endpoint (auth, jobs, entries).
   Never put secrets in frontend code — only the public API base URL.
2. Update App.jsx and the pages (Login, SignUp, Dashboard, Entry, AddJob, ManageJobs, Setup) so
   that data is saved to and retrieved from the backend/Supabase instead of localStorage. Real login
   and signup should hit the backend.
3. Keep loading and error states so the UI behaves well while requests are in flight.
4. Make sure the app still builds with `npm run build` and runs with `npm run dev`.

After the changes, give me a checklist to manually test every screen end-to-end so I can confirm
data persists in Supabase.
```

---

## Prompt 6 — Deployment prep and final security check

```
Get the project ready to deploy to Vercel and verify nothing sensitive is exposed.

1. Confirm vercel.json correctly builds the Vite frontend and routes /api/* to the Python function.
2. Search the whole repo for any hardcoded Supabase URLs, keys, or connection strings and confirm
   there are NONE outside .env / .env.example placeholders. Report what you checked.
3. Confirm .gitignore excludes .env, .env.*, node_modules, dist, .vercel and Python caches.
4. Give me a step-by-step deployment guide: which env vars to add in the Vercel dashboard, how to
   import the GitHub repo, and how to run the Supabase schema.sql.
5. Give me the git commands to commit and push this to a new GitHub repo, and tell me whether the
   repo should be public or private for this assessment and why.

Then summarise the final architecture in a few sentences I can use in my demo video.
```

---

## Tips for the demo video (don't forget)

- Open with the **live Vercel URL** visible in the browser address bar (2.5 marks for deployment).
- Complete a full workflow, then open the **Supabase Table Editor** to show the row that was just
  saved.
- Briefly explain the architecture and **show env vars in Vercel** to prove credentials are secure.
- Walk through the **GitHub repo structure and .gitignore** (keep this under 45 seconds).
- Show a few **key prompts** (this file) as your prompt walkthrough / appendix.
