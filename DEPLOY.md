# HotelMS Deployment Guide

## Architecture

| Layer | App | Suggested host |
|-------|-----|----------------|
| Frontend | Next.js (`frontend/`) | [Vercel](https://vercel.com) |
| Backend | Express + Prisma (`backend/`) | [Railway](https://railway.app) or [Render](https://render.com) |
| Database | MySQL | Railway MySQL / managed MySQL |
| Media | Cloudinary | Cloudinary dashboard |
| Payments | Razorpay | Razorpay dashboard |

## 1. Create managed MySQL

Create a MySQL instance and copy the connection string:

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/hotellms
```

## 2. Deploy backend (`backend/`)

### Build / start

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm start
```

### Required env (see `backend/.env.example`)

- `DATABASE_URL`
- `JWT_SECRET` (32+ random chars)
- `FRONTEND_ORIGIN` → your Vercel URL, e.g. `https://your-app.vercel.app`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=none` (needed when frontend/backend domains differ)
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Razorpay (when going live): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- SMTP (optional until email is wired): `SMTP_*`, `EMAIL_FROM`

### Bootstrap admin (once)

For a fresh database with no active admin, set `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_USERNAME`, and `DEFAULT_ADMIN_PASSWORD` before running the seed. Use a unique password of at least 16 characters; the seed will not create an administrator with built-in credentials. For an existing installation with an active admin, leave the email and username unset to preserve the existing admin and credentials while seeding other data.

```bash
npx prisma db seed
```

### Optional CodeCanyon demo viewer

For a public product demo only, set `DEMO_READ_ONLY_ENABLED=true`, `DEMO_READ_ONLY_EMAIL`, `DEMO_READ_ONLY_USERNAME`, and a `DEMO_READ_ONLY_PASSWORD` of at least 8 characters in the backend environment, then run `npx prisma db seed`. Keep these values in the hosting provider's environment settings, not in the repository. The account receives read-only access and cannot change admin data, profile details, or its password. Normal property administrators continue to use their separate Super Admin account. Use only synthetic guest and booking data on any publicly accessible demo instance.

To rotate an existing demo password intentionally, set `DEMO_READ_ONLY_UPDATE_PASSWORD=true` for the seed run. To stop provisioning the demo account, set `DEMO_READ_ONLY_ENABLED=false` and seed again; the configured demo account will be disabled.

## 3. Deploy frontend (`frontend/`)

### Vercel settings

- Root directory: `frontend`
- Framework: Next.js
- Build: `npm run build`
- Output: Next default

### Required env (see `frontend/.env.example`)

- `API_BASE_URL` → backend public URL
- `BACKEND_API_URL` → backend public URL
- `BACKEND_URL` → backend public URL
- `NEXT_PUBLIC_API_BASE_URL` → backend public URL
- `NEXT_PUBLIC_SITE_URL` → frontend public URL
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (optional)

## 4. Smoke checklist after deploy

1. Public homepage loads
2. Rooms / packages / contact pages load
3. Admin login works (`/admin/login`)
4. Media upload works (Cloudinary)
5. Create a test booking
6. Online pay path (Razorpay test mode) if keys are set
7. CORS / cookies: admin session persists across domains

## 5. Suggested Railway + Vercel flow

1. Push this repo to GitHub
2. Railway → New Project → Deploy from GitHub → select `backend`
3. Add MySQL plugin / external MySQL → set `DATABASE_URL`
4. Set backend env vars → deploy → run migrations
5. Vercel → Import GitHub repo → set Root Directory `frontend` → set env → deploy
6. Update `FRONTEND_ORIGIN` on backend to the Vercel URL and redeploy backend

## Notes

- Never commit `.env` files.
- Keep production admin credentials out of chat / tickets.
- Prefer test Razorpay keys until UAT sign-off.
