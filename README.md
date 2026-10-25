

# Income and Expense Tracker

**Take control of your finances.** A full-stack app to track income and expenses, set monthly budgets, reach savings goals, and export reports.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)



## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Quick start](#quick-start)
4. [Environment variables](#environment-variables)
5. [Project structure](#project-structure)
6. [API reference](#api-reference)
7. [Security](#security)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Roadmap](#roadmap)

## Features

- **Dashboard:** total balance, monthly income and expenses, savings rate, spending-by-category donut chart, 6-month income vs. expenses chart, recent transactions, and budget progress.
- **Transactions:** add, edit and delete; search by title; filter by type, category and date range; paginated table.
- **Budgets:** a monthly limit per category with progress bars, plus automatic notifications at 80% and 100% of the limit.
- **Savings goals:** set a target and deadline, add contributions, and get notified when a goal is reached.
- **Reports:** monthly summary with top spending categories, exportable as **PDF** or **Excel**.
- **Notifications:** unread counter and mark-as-read.
- **Profile:** name, currency (USD, EUR, EGP, SAR, AED, GBP), avatar upload, change password.
- **Appearance:** Light and Dark themes, responsive layout for phones and tablets.
- **Accounts:** register, sign in, forgot/reset password, email verification.
- **Admin panel:** platform statistics and user management (change role, delete).

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Recharts, lucide-react, react-hot-toast |
| Backend | Node.js (18+), Express, Mongoose, Joi, JSON Web Tokens, bcryptjs, Multer, Nodemailer, PDFKit, ExcelJS |
| Database | MongoDB (local, Docker, or Atlas) |

## Quick start

**Requirements:** Node.js 18+ and a MongoDB instance (local, Docker, or [Atlas](https://www.mongodb.com/atlas)).

```bash
# 1) Backend
cd backend
cp .env.example .env          # Windows CMD: copy .env.example .env
npm install
npm run seed                  # optional: demo data (development only)
npm run dev                   # http://localhost:5000

# 2) Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Before the first run, open `backend/.env` and set `MONGO_URI` and two **different** random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Demo accounts** (created by `npm run seed`, for local development only):

| Role | Email | Password |
|---|---|---|
| User | `demo@example.com` | `Demo1234` |
| Admin | `admin@example.com` | `Admin1234` |

**Docker:** `docker compose up --build` starts MongoDB and the API. Run the frontend separately with `npm run dev`.

**Scripts**

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Start the API with auto-reload |
| backend | `npm start` | Start the API (production) |
| backend | `npm run seed` | Reset and create demo data |
| frontend | `npm run dev` | Start the dev server (proxies `/api` to port 5000) |
| frontend | `npm run build` | Production build to `dist/` |

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string, including the database name |
| `JWT_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens (use a different value) |
| `JWT_EXPIRES` | No | Access token lifetime. Default `15m` |
| `CLIENT_URL` | Yes | Allowed frontend origin(s), comma-separated. Also used in email links |
| `PORT` | No | Default `5000` |
| `NODE_ENV` | Production | Set to `production` to enable secure cookies |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | No | SMTP settings. If `MAIL_HOST` is empty, emails are printed to the server console |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Leave empty in development and when using the Vercel rewrite below. Otherwise, the full API URL, e.g. `https://your-api.onrender.com/api` |

Never commit `.env` files or share secrets.

## Project structure

```
expense-tracker/
├── backend/
│   ├── server.js
│   ├── scripts/seed.js
│   └── src/
│       ├── app.js              # security middleware, routes
│       ├── config/             # database connection
│       ├── controllers/        # request handlers
│       ├── middleware/         # auth, admin, validation, uploads, errors
│       ├── models/             # User, Transaction, Budget, Goal, Notification, RefreshToken
│       ├── routes/
│       ├── services/           # budget alerts, report data
│       ├── utils/
│       └── validators/         # Joi schemas
├── frontend/
│   └── src/
│       ├── api/                # axios client with automatic token refresh
│       ├── context/            # Auth, Theme
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── utils/
├── docker-compose.yml
└── README.md
```

## API reference

Base path: `/api`. Protected routes need `Authorization: Bearer <accessToken>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email` · `GET /auth/me` |
| Users | `PUT /users/profile`, `/users/avatar`, `/users/change-password` |
| Transactions | `GET`, `POST /transactions` · `GET`, `PUT`, `DELETE /transactions/:id` |
| Budgets | `GET`, `POST /budgets` · `PUT`, `DELETE /budgets/:id` |
| Goals | `GET`, `POST /goals` · `PUT`, `DELETE /goals/:id` · `PATCH /goals/:id/contribute` |
| Dashboard | `GET /dashboard?month=&year=` |
| Reports | `GET /reports/monthly`, `/reports/pdf`, `/reports/excel` (`?month=&year=`) |
| Notifications | `GET /notifications` · `PUT /notifications/read-all`, `/notifications/:id/read` |
| Admin | `GET /admin/stats`, `/admin/users` · `PUT /admin/users/:id/role` · `DELETE /admin/users/:id` |
| Health | `GET /health` |

`GET /transactions` query parameters: `page`, `limit`, `type`, `category`, `search`, `from`, `to`, `sort`.

Errors share one shape: `{ "success": false, "message": "...", "details": [...] }`.

## Security

- Passwords hashed with bcrypt (12 rounds).
- Short-lived access tokens; refresh tokens live in an httpOnly cookie, are stored hashed, and **rotate on every use**. Changing or resetting a password signs out other sessions.
- Every query is scoped to the signed-in user, so users can only access their own data.
- Helmet, CORS allow-list, rate limiting (stricter on auth routes), Mongo operator sanitization, HTTP parameter pollution protection.
- Request validation with Joi; uploads limited to 2 MB PNG/JPG/WebP images.
- Forgot-password responds the same whether or not the email exists.

## Deployment

**Database:** create a MongoDB Atlas cluster, add a database user, allow network access, and copy the connection string with the database name (`.../expense_tracker?...`).

**Backend (Render / Railway):**

- Root directory: `backend` · Build: `npm install` · Start: `npm start`
- Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (new random values), and `CLIENT_URL` (your frontend URL, no trailing slash).
- Check `https://YOUR-API/api/health` after deploying.

**Frontend (Vercel / Netlify):**

- Root directory: `frontend` · Build: `npm run build` · Output: `dist`
- Add `frontend/vercel.json`. It makes deep links work and proxies API calls through the same domain, so the refresh cookie is not blocked as a cross-site cookie:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-API.onrender.com/api/:path*" },
    { "source": "/uploads/:path*", "destination": "https://YOUR-API.onrender.com/uploads/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- Leave `VITE_API_URL` empty with this setup. Changing it requires a redeploy.

**Notes**

- **First admin in production:** do not run `npm run seed` on a production database. Register normally, then set your user's `role` to `admin` in the database.
- **Uploads:** avatars are saved on the server disk. On hosts without persistent storage they disappear on redeploy; use a persistent volume or move uploads to S3 / Cloudinary.
- **Free tiers:** the backend may sleep after inactivity, so the first request can take around 30 seconds.
- **Email:** configure SMTP (for Gmail, use an app password) or verification and reset emails are only printed to the server logs.

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `MONGO_URI is not set` / `JWT_SECRET is not set` | `backend/.env` is missing or incomplete |
| `MongoServerSelectionError` | MongoDB is not running, or the Atlas connection string / IP allow-list is wrong |
| `EADDRINUSE` | Port already in use. Stop the old process (`netstat -ano \| findstr :5000`, then `taskkill /PID <pid> /F` on Windows) |
| Frontend shows "Network Error" | The backend is not running on port 5000, or `VITE_API_URL` is wrong |
| Signed out after refresh (deployed) | Cookie blocked cross-site. Use the `vercel.json` rewrite and leave `VITE_API_URL` empty |
| `404` when opening a page directly | Missing SPA rewrite to `index.html` |
| No emails arrive | SMTP not configured. Check the backend logs for the printed link |

## Roadmap

- Arabic / English interface
- Receipt image uploads
- Recurring transactions
- Swagger API docs
- Automated tests (Jest + Supertest)

## License

MIT. Add a `LICENSE` file to your repository before publishing.