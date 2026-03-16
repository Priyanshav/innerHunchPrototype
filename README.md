# ✦ Inner Hunch — Mental Wellness Platform

> A full-stack mental wellness app with mood tracking, articles, guided exercises, and psychiatrist booking.

---

## ⚡ Quick Start (3 steps)

### Step 1 — Install Prerequisites

Make sure you have these installed before continuing:

| Tool | Download | Check |
|------|----------|-------|
| Node.js (LTS) | https://nodejs.org | `node -v` |
| PostgreSQL | https://www.postgresql.org/download | `psql --version` |

---

### Step 2 — Set Up the Project

Open your terminal inside the `inner-hunch` folder and run:

```bash
# Install all Node packages
npm install
```

---

### Step 3 — Create Your .env File

Create a file called `.env` in the root of the project (same folder as `package.json`).
Copy the contents below and fill in your PostgreSQL password:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/inner_hunch
JWT_SECRET=inner-hunch-super-secret-key-change-this-2025
NODE_ENV=development
```

Replace `YOUR_POSTGRES_PASSWORD` with the password you chose when installing PostgreSQL.

---

### Step 4 — Create the Database

Open your terminal and run these commands one by one:

```bash
# Open the PostgreSQL shell
psql -U postgres

# Inside psql, run:
CREATE DATABASE inner_hunch;
\c inner_hunch
\i server/db-setup.sql
\q
```

Or run the SQL file directly from your terminal:

```bash
psql -U postgres -c "CREATE DATABASE inner_hunch;"
psql -U postgres -d inner_hunch -f server/db-setup.sql
```

You should see: `Inner Hunch database setup complete ✓`

---

### Step 5 — Start the App

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

---

## 📁 Project Structure

```
inner-hunch/
│
├── public/
│   └── index.html          ← Full frontend (HTML + CSS + JS)
│
├── server/
│   ├── index.js            ← Express server entry point
│   ├── db.js               ← PostgreSQL connection pool
│   ├── db-setup.sql        ← Database schema (run once)
│   │
│   ├── middleware/
│   │   └── auth.js         ← JWT token verification
│   │
│   └── routes/
│       ├── auth.js         ← POST /api/auth/login, /signup
│       ├── moods.js        ← GET/POST /api/moods
│       ├── appointments.js ← GET/POST /api/appointments
│       ├── profile.js      ← GET/PUT /api/profile
│       └── bookmarks.js    ← GET/POST /api/bookmarks/toggle
│
├── .env                    ← Your secrets (never commit this)
├── .env.example            ← Template for .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | `{firstName, lastName, email, password}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Login, returns JWT |
| GET | `/api/auth/verify` | — | Verify token, returns user |

### Moods
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/moods` | Log today's mood `{moodScore, energyScore, note}` |
| GET | `/api/moods/week` | Last 7 days of mood data |
| GET | `/api/moods/history` | All mood logs (paginated) |
| GET | `/api/moods/stats` | Avg mood, total logs, best/lowest |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get full profile + preferences |
| PUT | `/api/profile` | Update name, bio, avatar |
| PUT | `/api/profile/preferences` | Update notification/display settings |
| PUT | `/api/profile/password` | Change password |
| DELETE | `/api/profile` | Delete account |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List all appointments |
| POST | `/api/appointments` | Book new appointment |
| PATCH | `/api/appointments/:id/status` | Update status (cancel/complete) |
| DELETE | `/api/appointments/:id` | Delete appointment |

### Bookmarks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookmarks` | Get all bookmarked article IDs |
| POST | `/api/bookmarks/toggle` | Bookmark or unbookmark `{articleId}` |

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts, avatars, streaks |
| `mood_logs` | Daily mood + energy entries |
| `appointments` | Booked psychiatrist sessions |
| `bookmarks` | Saved articles per user |
| `user_preferences` | Notification + display settings |

---

## 🛠 Troubleshooting

### "password authentication failed for user postgres"
Your PostgreSQL password in `.env` is wrong. Double-check it:
```bash
# Test your connection manually
psql -U postgres -c "SELECT 1;"
```

### "database inner_hunch does not exist"
You need to create the database first:
```bash
psql -U postgres -c "CREATE DATABASE inner_hunch;"
psql -U postgres -d inner_hunch -f server/db-setup.sql
```

### "Cannot find module 'express'"
You need to install packages:
```bash
npm install
```

### "EADDRINUSE: address already in use :::3000"
Port 3000 is taken. Change it in `.env`:
```env
PORT=3001
```

### App loads but login doesn't work
Make sure the server is running (`npm run dev`) before trying to log in.
Check your terminal for any red error messages.

### On Windows — psql not recognized
Add PostgreSQL to your PATH. Default location:
```
C:\Program Files\PostgreSQL\16\bin
```
Add this to your System Environment Variables → PATH.

---

## 🚀 Running in Production (optional)

```bash
# Use pm2 to keep it running
npm install -g pm2
pm2 start server/index.js --name "inner-hunch"
pm2 save
pm2 startup
```

---

## 💙 Built with

- **Frontend** — Vanilla HTML/CSS/JS, Chart.js
- **Backend** — Node.js, Express
- **Database** — PostgreSQL
- **Auth** — JWT + bcrypt
- **Fonts** — Cormorant Garamond, DM Sans
