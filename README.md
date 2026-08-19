# DB Manager

A modern, secure, web-based MySQL/MariaDB database management system built with Next.js. Manage multiple database connections, browse tables, run SQL queries, and inspect table structures — all through a clean, responsive interface.

---

## Features

- **User Authentication** — Secure registration and login with bcrypt-hashed passwords and persistent JWT sessions
- **Saved Connections** — Store multiple MySQL/MariaDB connection profiles with encrypted credentials
- **Connection Testing** — Test connections before saving with safe, human-readable error messages
- **Database Discovery** — Browse all databases on a connected server (user + system databases separated)
- **Table Discovery** — View tables with engine, approximate row count, and size
- **Table Browsing** — Paginated data viewer (25/50/100/250 rows per page) with search, sorting, and CRUD operations
- **Row Management** — Insert, edit, and delete rows with form-based interfaces respecting column types, nullability, defaults, and auto-increment
- **Table Structure** — View columns (type, nullable, keys, defaults, extras) and indexes
- **SQL Console** — Execute custom queries with syntax-aware destructive query warnings (DROP, TRUNCATE, DELETE, ALTER)
- **Password Management** — Update your account password from the settings page
- **Responsive Design** — Works on desktop and mobile with collapsible navigation and horizontally scrollable tables

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| App Database | MySQL 8+ / MariaDB |
| External DB | MySQL 2+ / MariaDB (via `mysql2`) |
| Auth | bcryptjs + jose (JWT) |
| Encryption | AES-256-GCM (Node.js crypto) |
| Icons | Lucide React |

---

## Prerequisites

- Node.js 18+ and npm
- MySQL or MariaDB server (for the application database)
- One or more MySQL/MariaDB servers to manage (can be the same server)

---

## Installation

### 1. Clone / Extract

```bash
cd db-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Application Database (where users, sessions, and connections are stored)
APP_DB_HOST=localhost
APP_DB_PORT=3306
APP_DB_NAME=db_manager
APP_DB_USER=root
APP_DB_PASSWORD=your_mysql_password

# Encryption key for external DB passwords (32+ characters recommended)
DATABASE_ENCRYPTION_KEY=change-this-to-a-32-char-random-string!!

# JWT session secret (long random string)
SESSION_SECRET=change-this-to-a-long-random-secret-key
```

> **Security note:** `DATABASE_ENCRYPTION_KEY` and `SESSION_SECRET` should be strong, unique, and never shared. They are server-side only.

### 4. Initialize Application Database

Run the provided schema against your application MySQL instance:

```bash
npm run db:init
```

Or manually run `scripts/schema.sql` in your MySQL client.

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
db-manager/
├── scripts/
│   ├── schema.sql              # Application DB schema
│   └── init-db.js              # DB initialization helper
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── connections/page.tsx
│   │   │   └── settings/page.tsx      # Change password
│   │   ├── database/
│   │   │   └── [connectionId]/
│   │   │       ├── page.tsx           # Database list
│   │   │       └── [database]/
│   │   │           ├── page.tsx       # Table list
│   │   │           └── [table]/
│   │   │               ├── page.tsx   # Browse rows
│   │   │               ├── structure/page.tsx
│   │   │               └── sql/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── session/route.ts
│   │   │   │   └── update-password/route.ts
│   │   │   ├── connections/
│   │   │   │   ├── route.ts
│   │   │   │   └── test/route.ts
│   │   │   └── database/
│   │   │       ├── databases/route.ts
│   │   │       ├── rows/route.ts
│   │   │       ├── sql/route.ts
│   │   │       ├── structure/route.ts
│   │   │       └── tables/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── layout/Header.tsx
│   ├── lib/
│   │   ├── auth/session.ts       # JWT session management
│   │   ├── crypto/index.ts       # AES-256-GCM encryption
│   │   ├── db/
│   │   │   ├── app.ts            # Application DB pool
│   │   │   └── external.ts       # External DB connections
│   │   └── utils.ts
│   ├── middleware.ts             # Route protection
│   └── types/index.ts
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/session` | Get current user |
| POST | `/api/auth/update-password` | Change account password |
| GET | `/api/connections` | List saved connections |
| POST | `/api/connections` | Create connection |
| PUT | `/api/connections` | Update connection |
| DELETE | `/api/connections?id={id}` | Delete connection |
| POST | `/api/connections/test` | Test connection credentials |
| GET | `/api/database/databases?connectionId={id}` | List databases |
| GET | `/api/database/tables?connectionId={id}&database={db}` | List tables |
| GET | `/api/database/rows?...` | Browse rows (paginated, searchable, sortable) |
| POST | `/api/database/rows` | Insert row |
| PUT | `/api/database/rows` | Update row |
| DELETE | `/api/database/rows?...` | Delete row |
| GET | `/api/database/structure?...` | Table structure + indexes |
| POST | `/api/database/sql` | Execute SQL query |

---

## Security Features

- **Password hashing** — All application passwords hashed with bcrypt (cost factor 12)
- **HTTP-only cookies** — Session tokens stored in secure, `HttpOnly`, `SameSite=lax` cookies
- **Password encryption** — External database passwords encrypted with AES-256-GCM using a server-side key
- **No client-side DB access** — All database operations happen server-side via Next.js API routes
- **Parameterized queries** — All user-provided values use parameterized queries to prevent SQL injection
- **Identifier sanitization** — Database/table/column names are validated before being used in SQL
- **Safe error messages** — Stack traces and sensitive connection details are never exposed to the client
- **Route protection** — Unauthenticated users are redirected to login via middleware
- **Destructive query warnings** — DROP, TRUNCATE, DELETE, and ALTER queries require explicit confirmation

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_DB_HOST` | Yes | Application MySQL server hostname |
| `APP_DB_PORT` | No | Application MySQL server port (default: 3306) |
| `APP_DB_NAME` | Yes | Application database name |
| `APP_DB_USER` | Yes | Application database username |
| `APP_DB_PASSWORD` | No | Application database password |
| `DATABASE_ENCRYPTION_KEY` | Yes | 32+ character key for encrypting saved connection passwords |
| `SESSION_SECRET` | Yes | Secret key for signing JWT session tokens |

---

## Usage Flow

1. **Register** at `/register` or **Login** at `/login`
2. **Dashboard** — View your saved connections and recent activity
3. **Add Connection** — Go to `/dashboard/connections`, fill in host/port/credentials, test, then save
4. **Browse Database** — Click a connection to see its databases
5. **Browse Tables** — Select a database to see its tables
6. **Manage Data** — Click "Browse" on a table to view, search, sort, insert, edit, and delete rows
7. **Inspect Structure** — View column definitions and indexes
8. **Run SQL** — Execute custom queries with result display and destructive query warnings
9. **Change Password** — Go to Settings from the header menu

---

## Roadmap / Possible Extensions

- [ ] Create / drop / rename tables
- [ ] Add / modify / delete columns
- [ ] Create / delete indexes
- [ ] Export table data to CSV/JSON
- [ ] Import data from CSV
- [ ] Query history / saved queries
- [ ] Dark mode
- [ ] Connection health monitoring
- [ ] Query execution time display
- [ ] Foreign key relationship visualization

---

## License

MIT
