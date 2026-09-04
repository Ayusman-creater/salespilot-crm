# SalesPilot — Role-Based Sales CRM

A full-stack CRM for managing leads, customers, and deals through a sales pipeline, with role-based access control for Admins, Sales Managers, and Sales Executives.

**Live demo:** _add your deployed frontend URL here once live_
**API:** _add your deployed backend URL here once live_

---

## Tech Stack

**Frontend**
- React (Vite)
- Redux Toolkit + RTK Query (state management & data fetching)
- React Router
- Tailwind CSS
- Recharts (pipeline chart)
- Lucide React (icons)

**Backend**
- Node.js + Express
- MongoDB (Atlas) with Mongoose
- JWT authentication (httpOnly cookies)
- bcrypt for password hashing

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---

## Features

### Authentication & Access Control
- Register / Login / Logout with JWT stored in httpOnly cookies
- Three roles with different data visibility, enforced **server-side**, not just hidden in the UI:
  - **Admin** — sees and manages everyone's data
  - **Sales Manager** — sees their team's data, can reassign within their team
  - **Sales Executive** — sees only their own assigned records

### Core Modules
- **Leads** — list with search/filter (status, priority, source) + pagination, detail view, notes, assignment, conversion to Customer + Deal
- **Customers** — list + detail, shows related deals
- **Deals** — Kanban-style pipeline board (Qualification → Discovery → Proposal → Negotiation → Won/Lost) with stage transition rules
- **Activities** — follow-up tasks with status (Pending/Completed/Overdue), filterable
- **Users** (Admin only) — create users, change roles, activate/deactivate
- **Notifications** — in-app notifications with unread count
- **Dashboard** — role-scoped metrics (leads, customers, deals, activities), pipeline-by-stage chart, and a Team Performance table (Admin/Manager only) with live client-side sorting

### UI
- Role-aware sidebar navigation (nav items are filtered by the logged-in user's role)
- Dashboard stat cards deep-link into filtered list views (e.g. clicking "Overdue" activities navigates to `/activities?status=Overdue` with the filter pre-applied)

---

## Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your own values:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@crm.test | password123 |
| Sales Manager | manager@crm.test | password123 |
| Sales Executive | exec1@crm.test | password123 |

---

## Project Structure
