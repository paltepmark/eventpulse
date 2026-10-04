# Deploy EventPulse AI to Render

## What is included

This project is packaged as a Docker-based Render web service. The included `Dockerfile` installs the pinned pnpm toolchain, installs dependencies, builds the React/Express app, and starts the production server. The included `render.yaml` is an optional Render Blueprint with the required health check and environment-variable placeholders.

## Important: ZIP upload flow

Render deploys from a connected Git repository or a Docker image; it does not deploy a ZIP file directly as a live service. Unzip this archive, create a private GitHub/GitLab repository, push the extracted project, then connect that repository to Render. Do not commit `node_modules`, `dist`, `.git`, or environment files.

## Render setup

1. In Render, choose **New → Web Service** and connect the repository containing the extracted project.
2. Choose **Docker**. Render will use the root `Dockerfile`; the service listens on the `PORT` value supplied by Render and exposes `/api/health` for health checks.
3. Add the environment variables below. Keep all secret values in Render's Environment settings; never commit them to the repository.
4. Deploy the service. After the first successful deploy, run the database migration once from a Render Shell or another trusted environment with the same `DATABASE_URL`:

```bash
pnpm db:migrate
```

The migration is additive and creates the users, workspace, positions, trades, risk settings, and agent activity tables.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL-compatible connection string for the managed application data. |
| `MANUS_PROJECT_ID` | Manus OAuth application/project ID. |
| `MANUS_JWT_SECRET` | Session/JWT validation secret for the Manus OAuth project. |
| `MANUS_OAUTH_API_URL` | Manus OAuth API base URL, for token exchange and user lookup. |
| `NODE_ENV` | Set to `production`. |

These are optional unless the related platform integration is used: `MANUS_API_URL`, `MANUS_API_KEY`, and `OWNER_OPEN_ID`.

## OAuth callback

After Render gives the service a public URL, register this callback URL in the Manus OAuth application configuration:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/oauth/callback
```

The sign-in button uses the current browser origin, so the callback must exactly match the deployed Render origin and `/api/oauth/callback` path. Test both the sign-in and account creation flow after registering the callback.

## Database note

The app uses MySQL-compatible Drizzle migrations. Render's service must point to a MySQL-compatible provider through `DATABASE_URL`; a PostgreSQL-only DSN will not work with this project as written.

## Local verification before pushing

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Do not add `.env`, credentials, `node_modules`, or `dist` to the repository or ZIP.
