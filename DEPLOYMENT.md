# Vercel deployment checklist

Status: source prepared; local journeys and a mocked cloud adapter tested. No live Vercel or Supabase deployment has been tested or created.

## 1. Connect persistent storage

Use your own Supabase project. Review its region, quotas and pricing in your account before creating resources. No plan or cost is assumed here. Setup can be assisted later; credentials should only be entered through a secure secret form or directly in the service dashboard, never pasted into chat or GitHub.

Run `supabase/setup.sql` in that project's SQL editor. It creates only:
- `public.jobportal_records`, with RLS enabled and no anonymous/authenticated direct access;
- private bucket `jobportal-resumes`, with a 5 MB per-file limit.

Use a dedicated demo project/bucket. Do not make the bucket public. The server uses the service-role key, issues temporary signed upload URLs, checks uploaded file size and redirects resume downloads to 60-second signed storage URLs. The key must never appear in client code.

## 2. Import this GitHub repository in Vercel

- Repository: `Danwantari/jobportal-demo`
- Root directory: repository root
- Framework preset: Other
- Node.js: 22.x or later
- Build command: leave empty (no frontend compilation)
- Output directory: leave unset; let Vercel use the root project configuration
- Do not select only the `public` folder, which would omit the API.

The root `vercel.json` maps the page, API paths and resume paths to `api/handler.js`. Its handler is shared with the locally tested Node server. No service creation or deployment has been performed by this repo upload.

## 3. Set server-only Vercel environment variables

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service-role secret, server side only |
| `SUPABASE_RESUME_BUCKET` | `jobportal-resumes` |
| `DEMO_ACCESS_TOKEN` | A strong private demo access password of your choice |

Apply to each intended environment (Production and Preview as needed), then deploy/redeploy. Do not use `NEXT_PUBLIC_` or otherwise expose these secrets. Never commit `.env` files. For optional local cloud-mode testing: fill `.env.local` privately and run `node --env-file=.env.local server.js`.

Online, the browser asks for Basic Auth. Username can be `demo`; password is `DEMO_ACCESS_TOKEN`. Anyone with that password can use all demo tabs, view synthetic applications/resumes and reset the shared demo. It is a prototype, not a production applicant system. Use fictional information only. This simple gate does not include user management, rate limiting, or malware scanning.

## 4. Verify all journeys on the actual deployment

- Page loads without console errors; missing config gives 503, not silent data loss.
- Wrong/no password cannot read jobs, applications, or resumes.
- Generate, edit, preview and publish a fictional job.
- Candidate portal shows it; search by title/location works.
- Invalid name/email, missing resume and oversized files fail clearly.
- Apply with the sample PDF; review and download it from Recruiter Applications.
- Repeat with a synthetic 5 MB file: upload goes to Supabase directly, not through the Vercel function body.
- Try a fresh browser session and a redeploy: jobs and applications remain.
- Test mobile layout and resume download.
- Reset with confirmation: applications and resumes disappear; three seed jobs remain.

If browser uploads fail, inspect the project's Storage access/CORS response. Do not solve permission errors by making the bucket public or putting the service-role key into HTML. Supabase setup and actual Vercel routing must be live-tested before calling the online version ready.

## Official references used

- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/storage
- https://vercel.com/docs/vercel-blob/server-upload
- https://supabase.com/docs/guides/storage/uploads/standard-uploads
