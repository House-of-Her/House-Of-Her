# House Of Her — Agency Operating System

High-tech dual-portal dashboard for running an OnlyFans agency.

## Features

### Management Portal (Admin / Staff)
- Live overview of all models + who is currently live
- **Shift sign-in / sign-out** for chatters (with duration tracking)
- Create & manage custom / content / voice-note requests
- Mark requests completed
- Review & approve content uploaded by models
- **Content Calendar** of scheduled releases
- Chatter audit logging (score shifts, flags)
- Create & send invoices to models
- Add new models (auto-creates their login)
- Real-time activity feed + notification badge
- Dark mode toggle
- Mobile-friendly + PWA-ready

### Model Portal
- **Go Live** button → instantly notifies staff
- View assigned requests & mark them complete
- Upload content with release notes + preferred release datetime
- Record voice notes directly in browser (or upload) linked to requests
- View personal invoices & payouts
- Personal stats

### Multi-user & Permissions
- Roles: `admin`, `staff`, `model`
- Multiple staff accounts
- Multiple models, each with their own login
- Staff ↔ Model access table (ready for fine-grained permissions)

### Real-time
- Server-Sent Events infrastructure for live updates
- Notification polling + unread badge
- Live status broadcasts when models go live

## Tech Stack
- **Frontend**: React + Vite + Tailwind (pink/rose theme + dark mode)
- **Backend**: Node.js + Express + better-sqlite3
- **Auth**: JWT
- **Uploads**: Multer (local storage – ready for S3/R2)
- **PWA**: Manifest + mobile meta tags

## Quick Start

```bash
cd house-of-her
npm run install:all

# Terminal 1 – API
cd server && npm start

# Terminal 2 – Frontend
cd client && npm run dev
```

Open http://localhost:5173

### Demo Logins
| Role  | Email                     | Password  |
|-------|---------------------------|-----------|
| Admin | admin@houseofher.com      | admin123  |
| Staff | staff@houseofher.com      | staff123  |
| Model | barbie@houseofher.com     | model123  |
| Model | luna@houseofher.com       | model123  |

## Production Notes
- Change `JWT_SECRET` in `server/middleware/auth.js`
- Move file uploads to S3 / Cloudflare R2
- Put the API behind HTTPS
- Deploy frontend to Vercel / Netlify, API to Railway / Render / Fly.io
