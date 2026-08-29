# Deployment guide: Render + Vercel

This repository has two deployable applications:

| Application | Host | Repository root directory |
| --- | --- | --- |
| Express API | Render | `server` |
| Next.js frontend | Vercel | `client` |

Deploy the backend first. Its public URL is needed as a Vercel environment variable and as the Google OAuth callback origin.

## 1. Prepare and push the repository

The `.gitignore` excludes secrets, local environment files, dependencies, builds, and Vercel project metadata. Do **not** force-add `server/.env` or `client/.env.local`.

From the repository root, review what will be committed and push it:

```powershell
git init
git add .
git status
git commit -m "Prepare application for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

If this folder is already a Git repository, omit `git init`. Before pushing, inspect `git status` and make sure no `.env` file or API key appears there.

## 2. Set up MongoDB Atlas

1. Create a MongoDB Atlas project and database deployment.
2. Create a database user with a strong password and only the permissions the application needs.
3. Copy the Node.js connection string, replacing the password and database name as needed. It becomes `MONGODB_URI` on Render.
4. Add Render's outbound IP addresses to the Atlas network access list. If you cannot use fixed IP addresses on your Render plan, temporarily allow `0.0.0.0/0` **only with strong database credentials** and restrict it later if possible.

## 3. Deploy the backend on Render

1. In Render, select **New → Web Service**, then connect the GitHub repository.
2. Use these service settings:

| Render setting | Value |
| --- | --- |
| Language | `Node` |
| Branch | `main` |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

3. Under **Environment Variables**, add the following values. Do not put them in the repository.

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | A long, random secret |
| `JWT_EXPIRES_IN` | `7d` (or your preferred expiry) |
| `CREDENTIAL_ENCRYPTION_KEY` | A unique 64-character hexadecimal key |
| `GOOGLE_CLIENT_ID` | Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth web client secret |
| `GOOGLE_REDIRECT_URI` | `https://YOUR-RENDER-SERVICE.onrender.com/api/gmail/oauth/callback` |
| `CLIENT_URL` | Your final Vercel production URL, e.g. `https://your-app.vercel.app` |
| `AI_PROVIDER` | Your configured provider, e.g. `openai` |
| `AI_BASE_URL` | Required only for an OpenAI-compatible provider such as Groq |
| `AI_API_KEY` | AI provider API key |
| `AI_MODEL` | AI model name |
| `REDIS_URL` | Optional; leave unset if Redis is not used |

4. Create the service and wait for deployment to finish.
5. Open `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. It should return a JSON response with `"status":"ok"`.

Render runs commands from the configured root directory, so `server` is required for this monorepo. See Render's [web-service deployment guide](https://render.com/docs/your-first-deploy) and [Express guide](https://render.com/docs/deploy-node-express-app).

## 4. Update Google OAuth for production

In Google Cloud Console → **APIs & Services → Credentials**, open the OAuth 2.0 Web client used by this app.

Add this exact authorized redirect URI:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/gmail/oauth/callback
```

The value must exactly match `GOOGLE_REDIRECT_URI` on Render, including `https`, domain, path, and no trailing slash. Keep the localhost URI too if you still develop locally. Also add the Vercel URL to the OAuth consent screen's authorized domains/origins if your Google configuration requires it.

## 5. Deploy the frontend on Vercel

1. In Vercel, select **Add New → Project** and import the same GitHub repository.
2. Set **Root Directory** to `client`. Vercel should detect Next.js automatically.
3. In **Environment Variables**, create this Production variable before deploying:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

`NEXT_PUBLIC_API_URL` is intentionally public: it is compiled into browser code. Never place database, Gmail, JWT, or AI secrets in Vercel frontend variables.

4. Deploy. Copy the production URL, for example `https://your-app.vercel.app`.
5. Go back to Render and set `CLIENT_URL` to that exact Vercel URL, then redeploy the Render service.

Vercel applies production environment variables on the next production deployment. See [Vercel environment variables](https://vercel.com/docs/environment-variables) and [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## 6. Verify the production flow

1. Open the Vercel URL.
2. Register or log in.
3. Connect Gmail and complete Google consent.
4. Confirm the browser returns to the Vercel app and inbox loading works.
5. Open an email, generate a summary and an AI reply, then verify any provider quota errors are resolved by your configured AI plan.
6. Test sending only to an address you control.
7. Check Render logs if an API request fails.

## Common deployment issues

| Symptom | Check |
| --- | --- |
| CORS error in the browser | `CLIENT_URL` on Render must exactly match the Vercel production URL—no trailing slash. Redeploy Render after changing it. |
| Google `redirect_uri_mismatch` | The Google OAuth redirect URI and Render `GOOGLE_REDIRECT_URI` must be identical. |
| Render fails to start | Confirm Root Directory is `server`, Start Command is `npm start`, and all required environment variables are set. |
| Vercel calls localhost | Set `NEXT_PUBLIC_API_URL` to the live Render URL ending in `/api`, then redeploy Vercel. |
| Database connection fails | Check `MONGODB_URI`, database-user credentials, and Atlas network access. |
| AI rate limit error | This comes from the AI provider. Wait for its reset window, reduce request volume, or use a higher-quota model/key. |

## After deployment

Each push to `main` can trigger automatic deployments on both services when the repository integrations are enabled. For a safer workflow, use feature branches: Vercel creates preview deployments, while Render can be configured to deploy only the chosen production branch.
