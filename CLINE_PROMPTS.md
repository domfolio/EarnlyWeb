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

---

# Appendix B — Iteration, fixes & feature prompts

These are the prompts used after the initial build, in roughly the order they were run. A few small
fixes were applied directly to the files rather than via a prompt; those are listed at the end of
this appendix for full transparency.

## Deployment & GitHub

**Prompt — fix "Failed to fetch" (backend wiring):**
> The app shows "Failed to fetch" on the setup form. Fix three issues: (1) the backend config loads
> from `.env.local` but my credentials are in `.env` — create `earnly_backend/.env.local`; (2) the
> frontend calls `/setup`, `/me`, `/jobs` but the backend mounts routes under `/api`, so set
> `VITE_API_BASE_URL=http://localhost:8000/api`; (3) give me the exact commands to run the FastAPI
> backend locally on port 8000, and remind me to run the Supabase schema SQL.

**Prompt — GitHub + Vercel deployment:** one GitHub repo at the root, deployed as two Vercel
projects (Root Directory `earnly_backend` and `earnly_frontend`). Included: a full security scan for
hardcoded secrets, `.gitignore` verification, `git init`/commit/push commands, and a `DEPLOYMENT.md`
guide covering the env vars to set in Vercel, the cross-origin `VITE_API_BASE_URL`/`CORS_ALLOWED_ORIGINS`
values, and the Supabase Site URL / Redirect URL updates for production.

## UI & UX fixes

**Prompt — fix setup-page flash on login:** in `src/App.jsx`, use the existing `profileLoading`
flag so the route guards (`RequireSetup`, `/login` redirect, `RootRedirect`) show the loading screen
while the profile loads instead of briefly redirecting to `/setup`.

**Prompt — responsiveness:** add loading/disabled states on actions, a global top progress bar tied
to in-flight API requests, and a `loading` prop with spinner on the Button component.

**Prompt — week caching:** cache fetched weeks (stale-while-revalidate) so revisiting a week is
instant and the table never goes blank while loading.

**Prompt — "This week" button + field alignment:** add a small pill button by the week arrows that
jumps to the current week; centre-align the Break Time and Hourly Rate fields on the day detail page.

**Prompt — static week-range box:** give the week range pill a fixed width so it doesn't resize with
date length.

**Prompt — rounded table header corners:** round the top corners of the weekly table header to match
the shell.

## Time picker (iterated)

**Prompt — custom two-dropdown time picker** for Start/End on all days and the detail page, keeping
the stored value in `HH:MM` format.

**Prompt — popover style** (two scrollable finite columns of hours 00–23 and minutes 00–59, selected
value highlighted), replacing the plain dropdowns.

**Prompt — `--:--` placeholder + direct typing:** empty fields show `--:--` (not `00:00`); the user
can type digits left to right (e.g. 9,3,0 → 09:30; 2,0,3,0 → 20:30); empty stays empty.

## Export feature

**Manual step:** `npm install xlsx` in `earnly_frontend`.

**Prompt 1 — `src/utils/exportData.js` data gathering:** `gatherEntriesInRange(jobId, startDate,
endDate)` fetches each week in range via `getWeek`, maps day keys to real dates, filters to the
range, and returns row objects (date, day, start, end, break, hours, rate, pay, notes).

**Prompt 2 — CSV/XLSX download helpers:** `downloadCsv` and `downloadXlsx(rows, {includeBreaks,
includeNotes})`, with `xlsx` lazy-loaded via dynamic import to keep the bundle small.

**Prompt 3 — export dialog UI** in the Dashboard: range presets (Last 7 days, Last 2 weeks, This
week), Start/End date inputs, on/off toggles for Include breaks / Include notes, CSV vs XLSX format,
and an Export button wired to the export utilities.

**Prompt — export settings layout:** stack the two settings toggles into two rows instead of one.

**Prompt — smooth Notes typing:** back the Notes textarea with local state and debounce the save
(~500ms + on blur) instead of saving on every keystroke.

## Small fixes applied directly to files (not via Cline)

For completeness: the following minor edits were made directly rather than through a Cline prompt —
the `App.jsx` setup-flash guard wiring, the global progress bar + Button spinner, the week-cache
logic, the Break/Hourly-Rate alignment CSS, the rounded header-corner CSS, the static week-range
width, and the `dd-mm-yyyy` date formatting in the export Date column.
