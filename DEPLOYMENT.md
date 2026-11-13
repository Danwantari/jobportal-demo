# Vercel: no storage service required

This version is a static browser-only demo. It does not use Supabase or any database/API keys.

## New import

- Repo: `Danwantari/jobportal-demo`
- Branch: `main`
- Root directory: repository root
- Framework preset: **Other**
- Build command: none (leave blank)
- Output directory: **public** (also set in `vercel.json`)
- Environment variables: none required

Deploy, then open the deployment URL.

## Existing Vercel project

1. Confirm the project is connected to `Danwantari/jobportal-demo`, branch `main`.
2. In project Build and Deployment settings, use Framework **Other**, root directory unchanged at repo root, no build command, output directory **public**.
3. Deploy the latest `main` commit. A fresh commit may trigger automatic deployment; verify the deployment shows the latest commit, not an older cached deployment.
4. Open the new/current deployment URL, then hard refresh. Redeploy the latest commit if the old missing-Supabase JSON error remains.

Old Supabase variables are not read by this version. Do not create storage or paste secrets for this demo. Old API files and rewrite rules were removed. If your dashboard overrides old build/output settings, correct those settings above. No Vercel account changes or redeployment were done by the source repair.

## Check the live journey

Generate a draft, edit, publish, apply using the dummy PDF, open Recruiter Applications and download the PDF. Reload and check the application remains. Use Reset demo to clear it. Try another browser/profile and confirm it starts independently.

Data is browser-local per origin. It does not sync between devices, browser profiles, preview and production URLs, or other visitors. Clearing site data deletes it. Only dummy candidate details and resumes should be used. AI and external-source jobs are simulated. No employer or email integration exists.

If it still fails, share the exact deployment URL, screenshot and deployment/build log. A screenshot of the old JSON error does not reveal which project URL or commit is deployed.
