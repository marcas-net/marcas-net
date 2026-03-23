# MarcasNet — Day 5 Progress Report

**Date:** March 22, 2026  
**Project:** MarcasNet — Food & Nutrition Collaboration Platform

---

## What We Built

MarcasNet is a full-stack web platform for the food and nutrition industry. It connects food producers, nutrition laboratories, universities, food safety regulators, and nutrition professionals into a shared digital workspace where they can manage organizations, members, and compliance documentation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS 4 + Framer Motion |
| Backend | Node.js + Express 5 + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| File Uploads | Multer (PDF, Office, images — 10 MB limit) |
| Validation | Zod |

---

## Backend

### REST API — 15 Endpoints

**Authentication**
- `POST /api/auth/register` — Create account (email, password, name, role)
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Get current user profile (protected)

**Users**
- `GET /api/users/me` — Authenticated user data with organization

**Organizations**
- `GET /api/orgs` — List all organizations (public)
- `GET /api/orgs/:id` — Organization detail with members list
- `POST /api/orgs` — Create organization (protected)
- `PUT /api/orgs/:id` — Update organization (protected)
- `POST /api/orgs/:id/join` — Join an organization (protected)

**Documents**
- `GET /api/docs/org/:orgId` — List all documents for an organization
- `GET /api/docs/:id` — Get single document
- `POST /api/docs` — Upload document file + metadata (protected, multipart)
- `DELETE /api/docs/:id` — Delete document (owner or admin only)

**System**
- `GET /api/health` — Health check
- `GET /` — API status

---

### Database Schema

Three models across two migrations:

**User**  
`id`, `email` (unique), `password` (hashed), `name`, `role` (ADMIN / ORG_ADMIN / USER / REGULATOR / LAB), `organizationId`, `createdAt`, `updatedAt`

**Organization**  
`id`, `name`, `type` (COMPANY / LABORATORY / UNIVERSITY / REGULATOR / PROFESSIONAL), `country`, `description`, `createdAt`, `updatedAt`  
→ has many Users (members)  
→ has many Documents

**Document**  
`id`, `title`, `description`, `fileUrl`, `organizationId`, `uploadedById`, `createdAt`, `updatedAt`

---

### Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens (24h expiry) verified via middleware on all protected routes
- HTTP security headers via Helmet
- Request body validation via Zod schemas before any controller logic runs
- File type restrictions enforced (PDF, Word, Excel, PNG, JPG only)
- Document deletion checks that the requester is the owner or an admin

---

## Frontend

### Pages (8)

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Marketing homepage |
| Login | `/login` | Email + password login |
| Register | `/register` | Account creation with role selection |
| Dashboard | `/dashboard` | Welcome, stats, quick actions |
| Organizations | `/orgs` | Searchable and filterable organization list |
| Create Organization | `/orgs/create` | Form to create a new organization |
| Organization Detail | `/orgs/:id` | Org info, members, documents, join button |
| Profile | `/profile` | User info, role, org, logout |

### Component Library

Built a reusable UI component system used across all pages:

- **Button** — 5 variants (primary, secondary, outline, ghost, danger), 3 sizes, loading state
- **Input / Select / Textarea** — Consistent form fields with optional icons
- **Card / StatCard** — Container cards and dashboard metric tiles
- **Badge** — Color-coded labels for roles and organization types
- **Avatar** — Initials-based user avatar

### Layouts

- **AuthLayout** — Split panel (marketing left, form right) for login and register
- **DashboardLayout** — Full app shell with sidebar navigation, top header, mobile hamburger menu, and React Router `<Outlet>` for nested pages

### Landing Page (10 sections)

Built a complete marketing landing page with Framer Motion animations:

1. **Navbar** — Sticky with blur, animated mobile drawer
2. **Hero** — Headline, description, dual CTAs, animated SVG node network illustration
3. **Problem** — 4 cards: Scattered Certifications, Fragmented Collaboration, No Access Control, Slow Compliance Cycles
4. **Solution** — Centralized food documentation, structured org management, secure storage, cross-institutional coordination
5. **Features** — 5 animated feature cards: Food Organization Management, Nutrition & Food Documentation, Laboratory Collaboration, Food Certification & Compliance, Research & Institutional Collaboration
6. **How It Works** — 4 steps with spring-animated numbered icons and connecting line
7. **Who Is It For** — 5 org types: Food Producers, Nutrition Labs, Universities, Food Safety Regulators, Nutrition Professionals
8. **Partners** — Placeholder section for future partners
9. **CTA** — Dark gradient with glow animation and sign-up button
10. **Footer** — Brand description + product, company, and legal links

### Auth & State

- **AuthContext** — Global React context managing user, token, `isAuthenticated`, loading state
- **localStorage** persistence — Auth survives page refresh
- **Axios interceptor** — Auto-attaches JWT to every API request; redirects to `/login` on 401
- **ProtectedRoute** — Route guard that blocks access and redirects unauthenticated users to login

---

## Project Structure

```
marcas/
├── backend/
│   ├── src/
│   │   ├── config/          # Prisma client
│   │   ├── controllers/     # auth, users, organizations, documents
│   │   ├── middleware/       # JWT auth, Zod validation
│   │   ├── models/          # Database query functions
│   │   ├── routes/          # Route definitions
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── utils/           # Password + token helpers
│   │   └── index.ts         # App entry point
│   └── prisma/
│       ├── schema.prisma    # Data models
│       └── migrations/      # 2 applied migrations
└── frontend/
    └── src/
        ├── components/
        │   ├── landing/     # 10 landing page sections
        │   └── ui/          # Button, Card, Input, Badge, Avatar
        ├── context/         # AuthContext
        ├── layouts/         # AuthLayout, DashboardLayout
        ├── pages/           # 8 app pages
        ├── services/        # api.ts, authService, orgService, documentService
        └── styles/          # design-system.ts (tokens + color maps)
```

---

## Features Working End-to-End

- User registration and login with JWT authentication
- Create an organization (with type, country, description)
- Browse and search all organizations
- Join an organization
- Upload documents to an organization (with title and description)
- View and delete uploaded documents (with permission checks)
- User profile page with role and organization info
- Full responsive layout with mobile navigation
- Protected routes — unauthenticated users are redirected to login

---

## Git History (Day 5)

```
05c29b9  fix: make nginx listen on Railway's dynamic PORT env var
8826813  fix: correct railway dockerfile path for frontend service
5b22b6e  feat: update landing page content for food & nutrition industry
7894620  feat: refactor landing page with accurate content + Framer Motion
b60de81  feat: add modern SaaS landing page for MarcasNet
```
