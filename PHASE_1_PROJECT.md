# 🚀 Phase 1: ปั้น EV Charger ให้สมบูรณ์

> **สำหรับ:** nem + lalla
> **ลำดับ:** ทำตอนนี้ ก่อน Phase 2/3
> **เป้า:** Production-grade portfolio + ตรงกับตลาดแรงงาน Thai tech 2026

---

## 🎯 เป้าหมาย

ปั้น EV Charger ให้เป็น **production-grade portfolio** ที่บริษัท Tier S/A (Agoda, KBTG, LMWN, Grab, SYNQA) เห็นแล้วต้องการ — มี deploy URL, real-time, monitoring, security, mobile-installable, code quality automation, performance benchmarks

---

## ✅ Decisions ที่ตัดสินใจแล้ว

| เรื่อง | ตัดสินใจ |
|---|---|
| Mobile | Capacitor wrap (ไม่ rewrite RN) |
| Cloud | Vercel/Railway → AWS |
| WebSocket | ใส่ใน EV Charger (admin↔tech chat + real-time) |
| Logging | Hybrid: Winston + MongoDB + file fallback |
| Working style | Organic — Google + apply, ไม่ rigid timeline |

---

## 🗂️ ลำดับงาน

```
A. Foundation (audit + test + sync + code quality)
   ↓
B. Git Workflow
   ↓
C. DevOps (Docker → CI/CD)
   ↓
D. Add Features (WebSocket + MongoDB logging)
   ↓
E. Backend Production Hardening
   ↓
F. Frontend Hardening
   ↓
G. Deploy Phase 1 (Vercel + Railway)
   ↓
H. Mobile (Capacitor)
   ↓
I. Deploy Phase 2 (AWS migration)
```

---

# Section A: Foundation

## A.1 Audit `.gitignore` + `.env`

**ทำไม:** secret รั่วใน Git history = lifetime exposure

**ทำ:**
1. เช็ค `.gitignore` มี:
```gitignore
.env
.env.local
.env.*.local
node_modules/
*.log
dist/
build/
.DS_Store
coverage/
```

2. ถ้า `.env` เคย commit:
```bash
git rm --cached .env
git commit -m "chore: remove .env from tracking"
# Rotate ทุก secret ทันที
```

3. สร้าง `.env.example`:
```
DATABASE_URL=mysql://user:password@localhost:3306/dbname
OMISE_PUBLIC_KEY=pkey_test_xxxxx
OMISE_SECRET_KEY=skey_test_xxxxx
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
GOOGLE_MAPS_API_KEY=AIzaXxxxx
MONGO_URI=mongodb://localhost:27017/ev_charger_logs
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://xxx@sentry.io/yyy
```

## A.2 Manual Test 14 Features

**ทำ:** สร้าง `TEST_CHECKLIST.md` — กดอะไร → เห็นอะไร → DB state ไหน

## A.3 Schema Sync กับ lalla

- รัน `LALLA_MIGRATION.sql` + tables ใหม่ของ lalla (`spare_parts`, `part_requests`, `repair_proposals`)
- Verify ใน phpMyAdmin

## A.4 Cleanup

```bash
# mongoose จะใส่กลับใน D.2 (Hybrid logging) — ตอนนี้เก็บไว้
# ลบ unused dep อื่นๆ ที่ไม่ได้ใช้
```

## A.5 Jest + Supertest Automated Testing ⭐ ต้องมี

**ทำไม:** Manual test ไม่นับ production-ready — automated test = filter ของ Tier S/A interview

**ทำ:**
```bash
cd backend
npm install --save-dev jest supertest @types/jest
```

`backend/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

`__tests__/booking.test.js`:
```javascript
const request = require('supertest');
const app = require('../server');

describe('POST /api/bookings', () => {
  test('reject if charger unavailable', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ chargerId: 1, startTime: '2026-05-10T10:00' });
    expect(res.status).toBe(400);
  });
});

describe('Idle fee calculation', () => {
  test('5 บาท/นาที หลัง grace 5 นาที', () => {
    const fee = calculateIdleFee({ idleMinutes: 10, graceMinutes: 5 });
    expect(fee).toBe(25);
  });
});
```

**Target:** 50%+ coverage, focus: payment, booking, idle fee, wallet

## A.6 Fix Logger Password Leak 🔴 SECURITY

**ปัญหา:** `middleware/logger.js:17` save body ของ POST รวม `/auth/login` → password plain text ใน Mongo

**ทำ:**
```javascript
// middleware/logger.js
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

function sanitizeBody(body) {
  if (!body) return body;
  const clean = { ...body };
  for (const key of Object.keys(clean)) {
    if (SENSITIVE_FIELDS.some(s => key.toLowerCase().includes(s))) {
      clean[key] = '[REDACTED]';
    }
  }
  return clean;
}

// ใน middleware:
logger.info({ method, path, body: sanitizeBody(req.body) });
```

## A.7 `npm audit fix` 🔴 SECURITY

```bash
cd backend && npm audit fix
cd ../frontend && npm audit fix

# ถ้ามี breaking change → audit fix --force หลัง backup
# ถ้ายังเหลือ → review แต่ละตัว
```

## A.8 Complete 21 TODOs

**lalla รับ (14):** admin/notifications.js (7) + admin/reports.js (3) + admin/wallet.js (4)
**nem รับ (7):** payments.js (3 — Omise webhook signature, bank, refund) + stations.js (4 — station stats)

## A.9 Basic Database Index Audit

**ทำไม:** column ที่ใช้ใน WHERE บ่อยแต่ไม่มี index = slow query ใน production

**ทำ:** เพิ่ม index column เหล่านี้:
```sql
-- bookings: query บ่อยตาม user_id + status
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_charger_time ON bookings(charger_id, scheduled_start);

-- charging_sessions: query ตาม booking + status
CREATE INDEX idx_sessions_booking ON charging_sessions(booking_id);
CREATE INDEX idx_sessions_user_time ON charging_sessions(user_id, started_at);

-- notifications: query ตาม user + read status
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at);

-- payments: query ตาม user + status
CREATE INDEX idx_payments_user_status ON payments(user_id, status);

-- maintenance_tickets: query ตาม assigned_tech + status
CREATE INDEX idx_tickets_tech_status ON maintenance_tickets(assigned_tech_id, status);
```

## A.10 Database Migrations System (Knex.js) ⭐

**ทำไม:** เลิกส่ง `MIGRATION.sql` ทำมือ — schema sync forever

**ทำ:**
```bash
npm install knex
npx knex init
```

`migrations/20260504_create_spare_parts.js`:
```javascript
exports.up = (knex) => knex.schema.createTable('spare_parts', (t) => {
  t.increments('id');
  t.string('name').notNullable();
  t.integer('stock').defaultTo(0);
  t.integer('min_stock').defaultTo(5);
  t.timestamps(true, true);
});

exports.down = (knex) => knex.schema.dropTable('spare_parts');
```

```bash
npx knex migrate:latest    # apply all pending
npx knex migrate:rollback  # undo last
npx knex migrate:status    # ดู status
```

→ nem + lalla รัน command เดียว schema ตรงกันเป๊ะ

## A.11 README + Architecture Diagram ⭐

**ทำไม:** HR + recruiter scan README ก่อน — README ห่วย = skip ทันที

**สิ่งที่ต้องมี:**
1. Project description + screenshot
2. Live demo link (URL + .apk)
3. Tech stack (badges)
4. Features list (14 features)
5. Architecture diagram (draw ด้วย Excalidraw / Mermaid)
6. Quick start (`docker-compose up`)
7. API documentation link (Swagger URL)
8. Stats (150 endpoints, 27 tables, 14 features)
9. Team credits

**Architecture Diagram (Mermaid):**
```markdown
```mermaid
graph TB
  User[Mobile/Web User] --> CDN[Vercel CDN]
  CDN --> Frontend[React SPA]
  Frontend --> API[Node.js API<br/>Express + Socket.io]
  API --> MySQL[(MySQL<br/>Bookings, Users)]
  API --> Mongo[(MongoDB<br/>Logs, Audit)]
  API --> Redis[(Redis<br/>Cache, Queue)]
  API --> Omise[Omise Payment]
  API --> Maps[Google Maps API]
  API --> Sentry[Sentry Monitoring]
  Worker[BullMQ Workers] --> Redis
  Cron[node-cron Jobs] --> MySQL
```
```

## A.12 Verify Swagger Documentation Complete

**ทำไม:** API doc ครบ = บริษัทเห็นว่ามี discipline + เป็น API designer ที่คิดเป็น

**ทำ:**
- เปิด `/api-docs` (Swagger UI) — เช็คทุก 150 endpoints มี doc
- เพิ่ม schema definitions (request/response examples)
- ใส่ authentication header ใน Swagger
- Export เป็น OpenAPI 3.0 spec → commit เป็น `openapi.yaml`

## A.13 Code Quality Automation (ESLint + Prettier + Husky) ⭐

**ทำไม:** บริษัท Tier A+ คาดหวังเลย — code style consistency = signal ของ engineer คุณภาพ

**Install:**
```bash
cd backend
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

`.eslintrc.json`:
```json
{
  "env": { "node": true, "es2022": true, "jest": true },
  "extends": ["eslint:recommended", "prettier"],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

`commitlint.config.js`:
```javascript
module.exports = { extends: ['@commitlint/config-conventional'] };
```

`.husky/pre-commit`:
```bash
npx lint-staged
```

`.husky/commit-msg`:
```bash
npx --no -- commitlint --edit $1
```

`package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx}": ["eslint --fix", "prettier --write"]
  }
}
```

→ **ผล:** commit ทุกครั้ง auto-format + lint, commit message ผิด format = block ทันที

## A.14 ADRs (Architecture Decision Records) ⭐

**ทำไม:** Senior engineer signal — แสดงว่าคิด trade-off ไม่ใช่แค่ implement

**สร้าง:** `docs/adr/` folder

**Template:** `docs/adr/template.md`:
```markdown
# ADR-001: Title

## Status
Accepted | Superseded | Deprecated

## Context
[ปัญหาคืออะไร, constraint อะไร]

## Decision
[เลือกอะไร]

## Alternatives Considered
- Option A: pros/cons
- Option B: pros/cons

## Consequences
[ผลกระทบ + trade-off]
```

**ADRs ที่ควรเขียน (10 อันแรก):**
1. Why MySQL + MongoDB (polyglot persistence)
2. Why Capacitor over React Native
3. Why Vercel + Railway over AWS first
4. Why Hybrid Winston logging (console + file + Mongo)
5. Why Socket.io over Server-Sent Events
6. Why BullMQ over node-cron for idle fee
7. Why Tesla-style idle fee model
8. Why Outstanding debt B2 model
9. Why JWT + refresh token over session
10. Why Knex migrations over manual ALTER

---

# Section B: Git Workflow + 10 Tricks

## B.1 Branch Strategy

```
main (production)            ← deploy เฉพาะที่นี่
  ↑
dev (integration)            ← merge feature ที่นี่
  ↑
feature/<scope>-<desc>       ← ทำงานในของตัวเอง
```

**Workflow:**
1. `git checkout -b feature/payment-fix` (จาก dev)
2. ทำงาน → commit
3. Push → เปิด **Pull Request**
4. อีกคน review → merge เข้า dev
5. ทดสอบ dev OK → merge dev → main → CI auto deploy

## B.2 Top 10 Git Tricks

### 1️⃣ Conventional Commits (เลิก "สฟสสฟ")

```bash
git commit -m "feat(payment): add Omise webhook handler"
git commit -m "fix(booking): prevent double-booking"
git commit -m "refactor(auth): extract JWT to middleware"
```

**Types:** `feat` `fix` `refactor` `docs` `test` `chore` `perf`

### 2️⃣ `.gitignore` Strict + `.env.example`
ดู A.1

### 3️⃣ `git pull --rebase`
```bash
git config --global pull.rebase true
```

### 4️⃣ VS Code 3-way Merge Editor
Setting: `merge.editor` → enable

### 5️⃣ Branch Naming
```
feature/<description>
fix/<description>
chore/<description>
hotfix/<description>
```

### 6️⃣ `git stash`
```bash
git stash
git checkout main
# ... fix ...
git checkout feature/mine
git stash pop
```

### 7️⃣ `git lg` Alias
```bash
git config --global alias.lg "log --oneline --graph --all --decorate"
```

### 8️⃣ Branch Protection (GitHub)
Settings → Branches → Add rule for `main`:
- ✅ Require PR before merging
- ✅ Require approvals: 1
- ✅ Require status checks (CI pass)

### 9️⃣ `.env.example` Pattern
ดู A.1

### 🔟 PR Template
`.github/pull_request_template.md`:
```markdown
## What
## Why
## Test
- [ ] Unit test pass
- [ ] Manual test
## Screenshot
```

---

# Section C: DevOps

## C.1 Docker + docker-compose

### ปัญหา 3 ชั้นที่ Docker แก้:

| ชั้น | ปัญหา | Docker แก้ |
|---|---|---|
| 1 | Node version ต่างกัน | ทุกคนได้ version เดียว |
| 2 | DB schema desync | Mount migration ใน container |
| 3 | "Works on my machine" | `docker-compose up` = env เหมือนเป๊ะ |

### `Dockerfile` (backend):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env
    depends_on: [mysql, mongo, redis]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: ev_charger
    volumes:
      - mysql-data:/var/lib/mysql
      - ./backend/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  mongo:
    image: mongo:7
    volumes: [mongo-data:/data/db]

  redis:
    image: redis:7-alpine

volumes:
  mysql-data:
  mongo-data:
```

## C.2 GitHub Actions CI/CD

`.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: rootpass
          MYSQL_DATABASE: ev_charger_test
        ports: ['3306:3306']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm test
      - run: cd backend && npm run test:coverage
      - uses: codecov/codecov-action@v3
```

`.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -X POST ${{ secrets.RAILWAY_DEPLOY_HOOK }}
```

---

# Section D: Add Features

## D.1 Socket.io (Real-time + Admin↔Tech Chat)

### Use Cases:
1. Real-time charger status (available → in_use → charging)
2. Live charging progress (kWh, %, เวลาเหลือ)
3. Real-time queue position
4. Admin↔Tech chat (assign ticket)

### Backend:
```javascript
const { Server } = require('socket.io');
const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_URL } });

io.use(authenticateSocket); // JWT verification

io.on('connection', (socket) => {
  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket:${ticketId}`);
  });

  socket.on('chat_message', async ({ ticketId, message }) => {
    await db.query('INSERT INTO ticket_messages SET ?', { ticket_id: ticketId, user_id: socket.userId, message });
    io.to(`ticket:${ticketId}`).emit('new_message', { message, from: socket.userId, ts: Date.now() });
  });
});

function broadcastChargerStatus(chargerId, status) {
  io.emit('charger_status', { chargerId, status });
}
```

### Frontend:
```javascript
import { io } from 'socket.io-client';
const socket = io(API_URL, { auth: { token: localStorage.getItem('token') } });

useEffect(() => {
  socket.emit('join_ticket', ticketId);
  socket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));
  return () => socket.off('new_message');
}, [ticketId]);
```

## D.2 MongoDB Hybrid Logging

### ทำไม MongoDB เหมาะกับ log:
| เหตุผล | Why |
|---|---|
| Schema flexible | log แต่ละ event field ต่าง |
| Write-heavy | log เขียนเยอะ — Mongo handle ดี |
| Query/search | หา "user X เมื่อ Y" ง่าย |
| Aggregation | นับ "error rate 24h" ใน 1 query |
| TTL index | log อายุ 30 วัน auto-delete |

### Hybrid Pattern:
```
Winston
  ├── console transport       → dev
  ├── file transport (daily)  → fallback
  └── MongoDB transport       → search + analytics
```

### Install:
```bash
npm install winston winston-mongodb winston-daily-rotate-file mongoose
```

### `utils/logger.js`:
```javascript
const winston = require('winston');
require('winston-mongodb');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI,
      collection: 'app_logs',
      expireAfterSeconds: 60 * 60 * 24 * 30,
    }),
  ],
});

module.exports = logger;
```

### 4 Use Cases:
1. **Application Logs** — info/warn/error
2. **Activity Log / Audit Trail** — user action timeline
3. **Notification History** — flexible schema per type
4. **Charger Telemetry** — temperature/kW over time

---

# Section E: Backend Production Hardening

## E.1 Security (Helmet + OWASP)

```bash
npm install helmet express-validator
```

```javascript
const helmet = require('helmet');
app.use(helmet());

const { body, validationResult } = require('express-validator');
app.post('/api/booking',
  body('chargerId').isInt(),
  body('startTime').isISO8601(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  }
);
```

**OWASP Top 10:**
- SQL injection → parameterized query (mysql2 default) ✅
- XSS → React escape default ✅
- CSRF → token-based auth ✅
- Sensitive data → HTTPS + sanitize log (A.6)
- Broken auth → JWT + bcrypt + refresh token (E.11)

## E.2 Sentry (Error Monitoring)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

## E.3 Redis (Cache + Rate Limit)

```bash
npm install ioredis
```

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

async function getStations() {
  const cached = await redis.get('stations:all');
  if (cached) return JSON.parse(cached);
  const stations = await db.query('SELECT * FROM stations');
  await redis.setex('stations:all', 300, JSON.stringify(stations));
  return stations;
}
```

## E.4 BullMQ (Refactor Cron Jobs)

```bash
npm install bullmq
```

```javascript
const { Queue, Worker } = require('bullmq');
const idleQueue = new Queue('idle-fee', { connection: redis });

await idleQueue.add('check-idle', { sessionId }, { delay: 30 * 60 * 1000 });

new Worker('idle-fee', async (job) => {
  await checkAndChargeIdleFee(job.data.sessionId);
}, { connection: redis });
```

## E.5 Health Check Endpoints

```javascript
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ready' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', error: e.message });
  }
});
```

## E.6 API Versioning ⭐

**ทำไม:** Production must-have — version bump = ไม่ break client เก่า

**ทำ:** เปลี่ยนทุก route จาก `/api/...` → `/api/v1/...`

```javascript
// server.js
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
// ... etc

// Future v2:
// app.use('/api/v2/payments', paymentV2Routes); // breaking change
```

Update Swagger basePath: `/api/v1`
Update frontend axios baseURL

## E.7 Graceful Shutdown ⭐

**ทำไม:** SIGTERM/SIGINT = pod restart, deploy — ต้อง drain connection

```javascript
const server = app.listen(PORT);

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);

  server.close(async () => {
    console.log('HTTP server closed');
    await mongoose.disconnect();
    await redis.quit();
    await db.end();
    process.exit(0);
  });

  // Force shutdown ถ้าค้างเกิน 30s
  setTimeout(() => process.exit(1), 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

## E.8 Compression Middleware ⭐

**ทำไม:** ลด response size 60-80% = เร็วขึ้น + bandwidth cost ลด

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

## E.9 CORS Hardening 🔴

**ปัญหาปัจจุบัน:** `server.js:53` hardcode localhost (จาก CLAUDE.md security issues)

**ทำ:**
```javascript
const cors = require('cors');

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://ev-charger.vercel.app', 'https://api.ev-charger.com']
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
```

## E.10 Strict Helmet CSP ⭐

**ทำไม:** Default Helmet CSP loose — strict CSP ป้องกัน XSS deeper

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.omise.co'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.omise.co', 'https://maps.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      frameSrc: ["'self'", 'https://cdn.omise.co'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
```

## E.11 Refresh Token + Rotation ⭐ Security

**ทำไม:** Single JWT = stolen = lifetime access. Refresh token rotation = limit blast radius

**ทำ:**
```javascript
// Login
function login(user) {
  const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id, family: uuidv4() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  // Store refresh token hash + family in DB
  return { accessToken, refreshToken };
}

// Refresh endpoint
app.post('/api/v1/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  // Verify token + check not revoked
  // If valid: issue new access + new refresh (rotate) + revoke old
  // If reused (already revoked): revoke whole family + force logout
});
```

## E.12 Performance Benchmarks ⭐ Portfolio gold

**ทำไม:** Concrete numbers > "I optimized things" — บริษัทชอบ

**ทำ:**
```bash
npm install --save-dev autocannon
```

`scripts/benchmark.js`:
```javascript
const autocannon = require('autocannon');

const benchmarks = [
  { url: 'http://localhost:5000/api/v1/stations', duration: 30 },
  { url: 'http://localhost:5000/api/v1/bookings', duration: 30, headers: { Authorization: 'Bearer XXX' } },
];

(async () => {
  for (const bench of benchmarks) {
    console.log(`Testing ${bench.url}...`);
    const result = await autocannon(bench);
    console.log(`  Req/sec: ${result.requests.average}`);
    console.log(`  Latency p99: ${result.latency.p99}ms`);
  }
})();
```

Document in `docs/PERFORMANCE.md`:
```markdown
## Performance Benchmarks (autocannon, 30s, 10 connections)

### Before optimization
- GET /api/v1/stations: 234 req/s, p99 = 89ms
- POST /api/v1/bookings: 87 req/s, p99 = 245ms

### After optimization (Redis cache + indexes)
- GET /api/v1/stations: 1,892 req/s, p99 = 12ms (8x improvement)
- POST /api/v1/bookings: 312 req/s, p99 = 78ms (3.6x improvement)
```

→ **Resume bullet:** "Optimized API throughput 8x via Redis caching + index audit (234 → 1,892 req/s)"

## E.13 OpenTelemetry Distributed Tracing ⭐

**ทำไม:** เห็น latency breakdown — "200ms = 50ms middleware + 100ms DB + 50ms Omise"

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

`tracing.js`:
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  serviceName: 'ev-charger-api',
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations()],
});
sdk.start();
```

`server.js` (ต้องอยู่บรรทัดแรกสุด):
```javascript
require('./tracing');
const express = require('express');
// ... rest
```

**View traces:** Honeycomb (free tier) / Jaeger (Docker) / Sentry Performance

## E.14 Sentry Performance + RUM ⭐

**ขยายจาก E.2** — Sentry มี Performance + Real User Monitoring built-in

**Backend:**
```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Mysql(),
  ],
});
```

**Frontend (RUM):**
```bash
npm install @sentry/react
```
```javascript
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});
```

→ ดู waterfall ของ user จริง: page load → API → DB → render

## E.15 Slow Request Middleware

**ทำไม:** Auto-log slow request > 500ms = หา bottleneck แบบ passive

```javascript
// middleware/timing.js
const logger = require('../utils/logger');
const SLOW_THRESHOLD_MS = 500;

module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    if (durationMs > SLOW_THRESHOLD_MS) {
      logger.warn('slow_request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs),
      });
    }
  });
  next();
};

// server.js
app.use(require('./middleware/timing'));
```

---

# Section F: Frontend Hardening ⭐

## F.1 Error Boundaries

**ทำไม:** React component crash = whole app white screen — Error Boundary catch + show fallback

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) {
    Sentry.captureException(error, { extra: info });
  }
  render() {
    if (this.state.hasError) return <FallbackUI />;
    return this.props.children;
  }
}

// usage
<ErrorBoundary><App /></ErrorBoundary>
```

## F.2 Code Splitting (React.lazy)

**ทำไม:** Bundle size ลด 50-70% = เปิดเร็วขึ้น = Lighthouse score สูงขึ้น

```jsx
import { lazy, Suspense } from 'react';

const PaymentPage = lazy(() => import('./pages/user/PaymentPage'));
const TripPlanPage = lazy(() => import('./pages/user/TripPlanPage'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/payment" element={<PaymentPage />} />
    <Route path="/trip" element={<TripPlanPage />} />
  </Routes>
</Suspense>
```

## F.3 Form Validation (zod + react-hook-form)

**ทำไม:** Manual validation = bug magnet. zod = schema-driven + type-safe + error message ดี

```bash
npm install zod react-hook-form @hookform/resolvers
```

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const bookingSchema = z.object({
  chargerId: z.number().int().positive(),
  startTime: z.string().datetime(),
  duration: z.number().min(15).max(480),
});

function BookingForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('chargerId', { valueAsNumber: true })} />
      {errors.chargerId && <span>{errors.chargerId.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## F.4 Loading States + Skeletons

**ทำไม:** Empty UI ระหว่างโหลด = ดูพัง — skeleton ดูเป็น production app

```jsx
// react-loading-skeleton
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

{isLoading ? (
  <>
    <Skeleton height={60} />
    <Skeleton count={5} />
  </>
) : (
  <StationList stations={stations} />
)}
```

## F.5 Image Optimization

**ทำไม:** รูปใหญ่ = หน้าโหลดช้า = user หาย

```jsx
// Lazy load + WebP fallback
<img
  src="/images/charger.webp"
  loading="lazy"
  decoding="async"
  alt="Charger"
/>

// Or use library: react-image / next/image (ถ้า migrate Next.js Phase 2)
```

---

# Section G: Deploy

## G.1 Phase 1 — Vercel + Railway

**Frontend (Vercel):**
1. Push GitHub
2. vercel.com → Import → root = `frontend/`
3. Env var: `VITE_API_URL` (or REACT_APP_API_URL)
4. Deploy → URL `*.vercel.app`

**Backend + DB (Railway):**
1. railway.app → New Project → from GitHub
2. Root = `backend/`
3. Add: MySQL, Redis, MongoDB services
4. Env vars (DATABASE_URL, REDIS_URL, MONGO_URI auto)
5. Deploy → URL `*.railway.app`

**Update frontend:**
- Set `VITE_API_URL` = backend Railway URL
- Redeploy

**ซื้อ custom domain:** Namecheap / Cloudflare → point ไป Vercel + Railway

## G.2 Phase 2 — AWS Migration

**Stack:**
- EC2 t2.micro (free tier) — Node app
- RDS — MySQL managed
- DocumentDB / MongoDB Atlas free tier — Mongo
- ElastiCache — Redis managed
- S3 — file uploads
- CloudWatch — logs + monitoring
- Route 53 — DNS
- ACM + Certbot — SSL

**ลำดับ:**
1. VPC + Security Groups
2. EC2 + Docker
3. RDS + import schema
4. ElastiCache Redis
5. MongoDB Atlas
6. S3 bucket + IAM role
7. Deploy via Docker Compose
8. Nginx reverse proxy + Let's Encrypt SSL
9. **CloudWatch alerts** (cost + error rate)
10. **DB automated backup** (RDS daily snapshot)

---

# Section H: Mobile (nem only)

## Capacitor Wrap → .apk

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "EV Charger" "com.nem.evcharger"

npm run build
npx cap add android
npx cap copy android
npx cap open android  # Android Studio → Build APK
```

→ ติดตั้งบนมือถือจริง + ขึ้น Google Play ได้

---

# Section J: Security Audit & Penetration Testing 🔥

> **ทำหลัง deploy เสร็จ** — ทดสอบ production-like env เพื่อหาช่องโหว่จริง

## ทำไม
- **Portfolio gold** — "Performed pen test on own system, found + fixed X vulnerabilities"
- บริษัท security-conscious (KBTG, SCB, fintech) ชอบมาก
- Validate ว่า E.1, E.10, E.11 (security hardening) ใช้ได้จริง

## Tools

| Tool | คือ | ใช้ทำอะไร |
|---|---|---|
| **OWASP ZAP** | Web vuln scanner | Auto scan ทุก endpoint หา XSS, SQLi, CSRF |
| **Burp Suite Community** | Intercept proxy | Modify request manually, test edge case |
| **sqlmap** | SQL injection tester | Test SQL injection ทุก parameter |
| **nmap** | Port scanner | ดูว่า server เปิด port อะไรบ้าง |
| **Nikto** | Web server scanner | Hardening web server |
| **jwt_tool** | JWT analyzer | Test JWT secret, algorithm confusion |

## Test Checklist (8 หมวด)

### 1. SQL Injection
```bash
# Test login endpoint
sqlmap -u "https://api.ev-charger.com/api/v1/auth/login" \
  --data='{"email":"test@test.com","password":"x"}' \
  --headers="Content-Type: application/json" \
  --level=5 --risk=3
```
→ ถ้าเจอ injection point = parameterized query ไม่ครบ → fix

### 2. JWT Manipulation
- เปลี่ยน `user_id` ใน payload → ดูเข้า user อื่นได้มั้ย
- Test "alg: none" attack
- Test brute force JWT secret (ถ้า secret อ่อน)

### 3. IDOR (Insecure Direct Object Reference)
```bash
# user A login → get token → call:
GET /api/v1/bookings/123  # booking ของ user B
# ถ้า return ข้อมูล = IDOR vuln → ต้องเช็ค ownership
```

### 4. Webhook Signature Forging
- ส่ง fake Omise webhook → ดู backend accept มั้ย
- ตอนนี้ payments.js TODO 3 จุดเรื่อง signature → fix แล้ว test

### 5. Race Condition
- 2 booking same slot พร้อมกัน (Apache Bench / k6)
- ดู DB เกิด double booking มั้ย → ต้องมี SELECT FOR UPDATE หรือ unique constraint

### 6. File Upload Exploit
- Upload `.php` แทนรูปได้มั้ย (test_evidence)
- Upload size 1GB ได้มั้ย (DoS)
- Path traversal `../../../etc/passwd`

### 7. Rate Limit Bypass
- ลอง brute force `/auth/login`
- เปลี่ยน IP → bypass rate limit ได้มั้ย

### 8. CORS / CSRF
- ส่ง request จาก origin อื่น → ผ่านมั้ย
- ดู E.9 hardening ครบมั้ย

## Workflow

```
1. Setup Kali Linux (VM หรือ WSL2)
2. Run OWASP ZAP automated scan ก่อน → ได้ list vuln เริ่มต้น
3. Burp Suite manual test 8 หมวดข้างบน
4. Document ทุก vuln เจอใน docs/SECURITY_AUDIT.md
5. Fix ทุกอัน → re-test → confirm fixed
6. เขียน blog post / GitHub issue → portfolio piece
```

## Output ที่ต้องการ

- `docs/SECURITY_AUDIT.md` — list vuln เจอ + fix
- Resume bullet: "Conducted penetration testing on own production deployment using OWASP ZAP and Burp Suite, identified and remediated X vulnerabilities (SQL injection, IDOR, weak JWT, file upload exploit)"

---

# 🤝 ส่วนที่ต้องคุยกับ lalla

1. **Schema migration** — รัน Knex migration (A.10)
2. **Docker setup** — ลง Docker Desktop + รัน `docker-compose up`
3. **Git workflow change** — feature branch + PR
4. **MongoDB integration** — log + audit + notification
5. **แบ่งงาน** — ใครทำอันไหนใน Phase 1
6. **ESLint/Prettier rules** — agree on style
7. **TODO 14 อันของ lalla** (admin/notifications, reports, wallet)

---

# 📖 Resources

- **Docker:** docker.com docs + "Docker Deep Dive" by Nigel Poulton
- **GitHub Actions:** docs.github.com/en/actions
- **Conventional Commits:** conventionalcommits.org
- **OWASP Top 10:** owasp.org/www-project-top-ten
- **Socket.io:** socket.io/docs/v4
- **Winston:** github.com/winstonjs/winston
- **BullMQ:** docs.bullmq.io
- **Knex.js:** knexjs.org
- **ESLint:** eslint.org
- **zod:** zod.dev
- **react-hook-form:** react-hook-form.com
- **autocannon:** github.com/mcollina/autocannon
- **Sentry:** docs.sentry.io
- **AWS Free Tier:** aws.amazon.com/free
- **Capacitor:** capacitorjs.com/docs
- **ADR template:** github.com/joelparkerhenderson/architecture-decision-record
