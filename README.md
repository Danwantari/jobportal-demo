# HireCloud / JobHub browser-local demo

A five-step prototype: brief, simulated AI draft, publish, candidate application, recruiter review and resume download. No Supabase, external database, API key, login, or server storage needed.

## Run locally

Node.js 22+:

```sh
npm start
```

Open http://localhost:3000. Runtime dependencies: none. You can also serve `public/` with any local static web server. Use HTTP localhost or HTTPS, not a `file://` URL.

## Deploy to Vercel

Import `Danwantari/jobportal-demo`, framework preset **Other**, repository root, output directory **public**, no build command. The included `vercel.json` sets the output directory. No environment variables or storage setup required. See [DEPLOYMENT.md](DEPLOYMENT.md) for existing-project settings and redeployment.

## Full journey

1. Review the brief and click Generate with AI (simulated).
2. Edit the draft and click Next.
3. Review the preview and publish to the candidate portal tab.
4. Apply using the sample PDF or a dummy PDF/DOC/DOCX up to 5 MB.
5. Open Recruiter Applications to review and download the resume.
6. Reload: data remains in this browser. Reset demo asks confirmation and clears demo data.

## Persistence and privacy

Jobs, applications and resume bytes are stored in **IndexedDB in each visitor's browser**, not sent to a server. Recruiter and candidate tabs share the same browser-local demo data. Another device, browser, profile, or separate visitor starts with its own three seed jobs and no applications. Different origins, including preview URLs and production URLs, have separate data. Browser data clearing, private mode or storage eviction can remove the data. It is not a shared applicant system or backup.

Do not use real personal information or resumes. AI is simulated, jobs and source-platform labels are fictional. No employer is contacted and no email is sent. The public site has no app password because there is no shared private backend. Site code is public, and browser-local information is accessible to whoever uses that browser profile.

## Tests

```sh
npm install
CHROME_PATH=/usr/bin/google-chrome npm test
```

Uses Playwright and installed Chrome. Tests the browser journey, sample and full 5 MB downloads, reload and same-browser-tab persistence, visitor isolation, reset, mobile layout, and absence of backend API requests. Screenshots go to `artifacts/`. Local tests pass; verify your actual Vercel URL after redeploying.

## Changes from the previous repository version

Removed Supabase adapter, serverless API, environment-variable requirements and online password gate. The approved browser-only model replaces cross-device shared persistence. The original Node/disk variant remains in Git history, but it is not the current deployment model.
