# Product Management System

A full-stack product management web application with image/video uploads, AI-generated descriptions, and a responsive dashboard. Built as a portfolio project.

**Live Demo:** https://product-management-system-three-psi.vercel.app/

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | ASP.NET Core (.NET 10), Entity Framework Core 10 |
| Database | PostgreSQL (via Npgsql EF Core provider) |
| Auth | JWT with HttpOnly cookies, BCrypt password hashing |
| Media | Cloudinary (images & videos, server-signed uploads) |
| AI | Groq API (product description generation) |
| Deployment | Vercel (frontend) · Render (backend + database) |

---

## Features

- **Authentication** — register, login, logout, change password, view and revoke active sessions per device
- **Products** — full CRUD with search, sort by category/status, and pagination
- **Media uploads** — main image + multi-file gallery per product; supports images and videos (up to 200 MB batch); uploaded directly to Cloudinary via server-signed requests
- **AI descriptions** — one-click product description generation powered by Groq
- **Dashboard** — live stats: total products, active vs. out-of-stock counts, breakdown by category, and recently added items
- **Responsive design** — works on mobile and desktop

---

## Screenshots

<img src="C:\Users\tiger\AppData\Roaming\Typora\typora-user-images\image-20260605110820908.png" alt="image-20260605110820908" style="zoom:50%;" />

---

## Getting Started

### Prerequisites

- Node.js 20+
- .NET 10 SDK
- PostgreSQL (or use a free Render PostgreSQL instance)
- Cloudinary account (free tier works)
- Groq API key (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ProductManagementSystem.git
cd ProductManagementSystem
```

### 2. Backend setup

```bash
cd backend/backend
```

Create `appsettings.Development.json` (see [Environment Variables](#environment-variables)) then run:

```bash
dotnet ef database update
dotnet run
```

The API will start at `http://localhost:5281`.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `.env.local` (see [Environment Variables](#environment-variables)) then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables

### Frontend — `frontend/.env.local`

| Variable | Description |
|---|---|
| `BACKEND_URL` | URL of the backend API (e.g. `http://localhost:5281` for local dev) |

### Backend — `backend/backend/appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "<postgresql-connection-string>"
  },
  "Jwt": {
    "Key": "<long-random-secret>",
    "Issuer": "ProductManagementSystem",
    "Audience": "ProductManagementSystem"
  },
  "AllowedOrigins": "http://localhost:3000",
  "Cloudinary": {
    "CloudName": "<your-cloud-name>",
    "ApiKey": "<your-api-key>",
    "ApiSecret": "<your-api-secret>"
  },
  "Groq": {
    "ApiKey": "<your-groq-api-key>"
  }
}
```

---

## Project Structure

```
ProductManagementSystem/
├── frontend/                  # Next.js app
│   └── src/
│       ├── app/               # App Router pages and API routes
│       │   ├── (protected)/   # Authenticated pages (dashboard, products, account)
│       │   ├── login/
│       │   └── register/
│       ├── components/        # Shared components (Navbar, PasswordInput)
│       └── lib/               # API client, types, server fetch helper
└── backend/
    └── backend/
        ├── Controllers/       # Auth, Products, ProductImages, AI, Account
        ├── Models/            # EF Core entities
        ├── DTOs/              # Request/response shapes
        ├── Services/          # JwtService, AiService, TokenCleanupService
        └── Migrations/        # EF Core migrations
```

---

## License

MIT
