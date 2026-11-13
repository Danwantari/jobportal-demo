# HireCloud / JobHub job-posting demo

A five-step prototype: brief, simulated AI draft, publish, candidate application, recruiter review and resume download. Fictional seed jobs and synthetic candidate data only. No employer integrations, real AI model, or outgoing emails.

## Run locally

Requires Node.js 22 or later. No runtime dependencies or external accounts needed.

```sh
npm start
```

Open http://localhost:3000. Stop with Ctrl+C. Jobs and resumes survive restarts in `data/` and `uploads/` (excluded from Git). The server binds to localhost by default. Use `HOST=0.0.0.0` only when you deliberately want network access.

## Demo journey

1. Review the prefilled Business Analyst brief. Click **Generate with AI**.
2. Edit the generated fields if needed; click **Next**.
3. Check the preview and publish. Required-field checks block incomplete publishing.
4. Open the candidate portal and apply with the built-in, valid synthetic PDF, or a PDF/DOC/DOCX up to 5 MB.
5. Open Recruiter Applications, review the saved application, and download its resume.
6. Reload or restart: saved jobs and applications remain. **Reset demo** asks for confirmation, then deletes demo data and resumes and restores three fictional seed jobs.

All three product screens are tabs within this one prototype. Their displayed domain labels are visual labels, not real external sites. The other-platform source badges are sample data, not scraped jobs.

## Vercel handoff

This repo includes a serverless handler, route configuration and an optional Supabase adapter. **Importing the repo alone is not enough for the full online journey.** Complete [DEPLOYMENT.md](DEPLOYMENT.md): configure the database, a private resume bucket, and server-only environment variables before deploying.

- Local mode: persistent JSON files + uploads on your computer.
- Vercel mode: persistent Supabase database + private Storage. Resume uploads go directly to signed storage URLs, retaining the original 5 MB limit without exceeding Vercel's 4.5 MB function request limit.
- Vercel with missing storage or demo-password settings returns a clear 503 instead of pretending to save data in temporary storage.
- Online access is protected by a shared demo password. This is not separate recruiter/candidate identity or production authorization.

No Vercel deployment or Supabase project has been created as part of this source upload. Live Supabase credentials, bucket permissions, CORS, and live Vercel routing must still be verified after connection.

## Tests

```sh
npm test
npm install
CHROME_PATH=/usr/bin/google-chrome npm run test:e2e
```

`npm test` covers API validation, publish/apply/download, restart persistence, reset and unsafe Vercel fallback refusal. E2E tests use Playwright with an installed Chrome (`CHROME_PATH` can point to yours). They cover the real browser journey in local mode and in cloud-adapter mode against a local Supabase API mock, including a full 5 MB upload/download. They produce screenshots under `artifacts/`.

**The mock is not proof that a live Supabase or Vercel deployment works.** Run the deployment acceptance checklist after connecting the actual services. Do not use real candidate information in this demo.

## Changes from the uploaded ZIP

Added standard start/test scripts; repeatable API/browser tests; a valid sample PDF; safer error handling and IDs; explicit prototype/no-email wording; reset confirmation; optional persistent Supabase storage and direct uploads; private-cloud fail-closed configuration; shared online password protection. Original local publish/apply/review behavior is retained. Simulated AI remains simulated.
