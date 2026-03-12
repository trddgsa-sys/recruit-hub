# RecruitHub — Referral-Based Recruitment Platform

A production-ready, full-stack recruitment platform where recruiter referral codes unlock job applications. Built with Next.js 14, TypeScript, PostgreSQL, and Prisma.

## Features

- **Referral Code System** — Recruiters generate unique codes (e.g., `REC-AB12X9`); candidates must enter a valid code to unlock full job details and apply.
- **Role-Based Access** — Admin, Recruiter, and Candidate roles with protected routes and API endpoints.
- **Applicant Tracking** — 7-stage hiring pipeline (Applied → Hired/Rejected) with kanban board.
- **Analytics Dashboards** — Charts and metrics for admin and recruiters (Recharts).
- **Email Notifications** — Application submitted, stage changes, interview invites, referral code usage.
- **CSV Export** — Admin can export platform summary, pipeline, and recruiter performance reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (JWT + Credentials) |
| Validation | Zod |
| Charts | Recharts |
| Email | Nodemailer |
| Containers | Docker + docker-compose |

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or Docker)

### 1. Clone and install

```bash
cd recruit-hub
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your database URL, NEXTAUTH_SECRET, etc.
```

### 3. Database setup

**Option A: Docker (recommended)**
```bash
docker-compose up -d db
```

**Option B: Local PostgreSQL**
```bash
# Create database manually
createdb recruithub
```

### 4. Run migrations and seed

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
# Open http://localhost:3000
```

### Seeded Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@recruithub.com | Admin123! |
| Recruiter | recruiter@recruithub.com | Recruit123! |
| Candidate | candidate@recruithub.com | Candidate123! |

**Demo referral code:** `REC-DEMO01`

## Docker Deployment

```bash
# Build and run everything
docker-compose up -d

# Run migrations inside the container
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

## Project Structure

```
recruit-hub/
├── prisma/
│   ├── schema.prisma         # Database schema (11 models)
│   └── seed.ts               # Sample data
├── src/
│   ├── app/
│   │   ├── (public)/         # Landing, jobs, unlock page
│   │   ├── (auth)/           # Login, register
│   │   ├── (candidate)/      # Candidate dashboard (4 pages)
│   │   ├── (recruiter)/      # Recruiter dashboard (4 pages)
│   │   ├── (admin)/          # Admin panel (7 pages)
│   │   └── api/              # 18 API route files
│   ├── components/
│   │   ├── ui/               # Button, Input, Badge, Modal, Card, Select, Spinner
│   │   ├── features/         # JobCard, JobFilters, StageKanban, ReferralCodeInput, Charts
│   │   └── layouts/          # Navbar, Sidebar, DashboardLayout
│   ├── lib/
│   │   ├── db.ts             # Prisma singleton
│   │   ├── auth.ts           # NextAuth config + role guards
│   │   ├── validations.ts    # Zod schemas
│   │   ├── referral.ts       # Code generation + validation
│   │   ├── email.ts          # Notification templates
│   │   └── utils.ts          # Helpers
│   ├── types/                # TypeScript types
│   └── middleware.ts         # Route protection
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Register user (email, password, name, role)
- `POST /api/auth/[...nextauth]` — NextAuth sign-in

### Companies (Admin)
- `GET /api/companies` — List companies
- `POST /api/companies` — Create company
- `GET/PUT/DELETE /api/companies/:id`

### Jobs
- `GET /api/jobs` — List with filters (search, location, salary, skills, etc.)
- `POST /api/jobs` — Create (admin)
- `GET /api/jobs/:id` — Preview or full (based on referral unlock)
- `PUT/DELETE /api/jobs/:id`
- `PATCH /api/jobs/:id/status` — Change status

### Referral Codes
- `GET /api/referral-codes` — Recruiter's codes
- `POST /api/referral-codes` — Generate new code
- `POST /api/referral-codes/validate` — Validate + unlock
- `GET /api/referral-codes/:id/stats`

### Applications
- `GET /api/applications` — Role-filtered list
- `POST /api/applications` — Apply (candidate, requires referral)
- `GET /api/applications/:id`
- `PATCH /api/applications/:id/stage` — Move stage

### Analytics
- `GET /api/analytics/admin` — Platform-wide metrics
- `GET /api/analytics/recruiter` — Recruiter metrics

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

## Referral Code Flow

1. Recruiter generates code → `REC-AB12X9`
2. Candidate visits `/unlock`, enters code
3. System validates: active? not expired? under usage limit?
4. ✅ → Candidate sees full job details + Apply button
5. Application links back to the recruiter

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | JWT signing secret | ✅ |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) | ✅ |
| `SMTP_HOST` | Email server host | For email |
| `SMTP_PORT` | Email server port | For email |
| `SMTP_USER` | Email account | For email |
| `SMTP_PASS` | Email password/app-key | For email |
| `EMAIL_FROM` | Sender address | For email |
| `UPLOAD_DIR` | Resume upload directory | Default: ./public/uploads |

## Deployment

### Railway
1. Push to GitHub
2. Connect repo to Railway
3. Add PostgreSQL addon
4. Set environment variables
5. Deploy

### Render
1. Create Web Service + PostgreSQL
2. Set build command: `npm install && npx prisma migrate deploy && npm run build`
3. Set start command: `npm start`

### Vercel
1. Deploy as Next.js project
2. Use external PostgreSQL (Neon, Supabase, Railway)
3. Set all environment variables

## License

MIT
