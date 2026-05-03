# 🚀 Phase 1: ปั้น EV Charger ให้สมบูรณ์

> **สำหรับ:** nem + lalla
> **ลำดับ:** ทำตอนนี้ ก่อน Phase 2/3

---

## 🎯 เป้าหมาย

ปั้น EV Charger ให้เป็น **production-grade portfolio** — มี deploy URL จริง, real-time, monitoring, security, mobile-installable

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

## 🗂️ ลำดับงาน (เสร็จ A → ต่อ B)

```
A. Foundation (audit + test + sync)
   ↓
B. Git Workflow setup
   ↓
C. DevOps (Docker → CI/CD)
   ↓
D. Add Features (WebSocket + MongoDB logging)
   ↓
E. Production Hardening
   ↓
F. Deploy Phase 1 (Vercel + Railway)
   ↓
G. Mobile (Capacitor)
   ↓
H. Deploy Phase 2 (AWS migration)
```

---

# Section A: Foundation

## A.1 Audit `.gitignore` + `.env`

**ทำไม:** secret รั่วใน Git history = lifetime exposure (Omise key, DB password, JWT secret)

**ทำ:**
1. เปิด `.gitignore` — เช็คว่ามี:
```gitignore
.env
.env.local
.env.*.local
node_modules/
*.log
dist/
build/
.DS_Store
```

2. ถ้า `.env` เคย commit ไปแล้ว:
```bash
git rm --cached .env
git commit -m "chore: remove .env from tracking"
# Rotate ทุก secret ทันที (เปลี่ยน Omise key + DB password + JWT secret)
```

3. สร้าง `.env.example` สำหรับ lalla copy:
```
DATABASE_URL=mysql://user:password@localhost:3306/dbname
OMISE_PUBLIC_KEY=pkey_test_xxxxx
OMISE_SECRET_KEY=skey_test_xxxxx
JWT_SECRET=your_secret_here
GOOGLE_MAPS_API_KEY=AIzaXxxxx
```

## A.2 Manual Test 14 Features

**ทำไม:** code เสร็จแต่ยังไม่ test = risk ตอน demo

**ทำ:** สร้าง `TEST_CHECKLIST.md` — กดอะไร → ต้องเห็นอะไร → DB ควรมี state ไหน
- Phase 1 (UX): payment selection, low balance, temperature, overheat, ETA, favorites
- Phase 2 (Smart): auto-stop, notifications, points, TOU, cancellation
- Phase 3 (Advanced): recurring, idle fee, trip planning

## A.3 Schema Sync กับ lalla

**ทำ:**
- บอก lalla รัน `LALLA_MIGRATION.sql` + tables ใหม่ของ lalla เอง:
  - `spare_parts`, `part_requests`
  - `repair_proposals`
  - `booking_skip_dates`
- Verify ใน phpMyAdmin ของทั้งคู่ว่า table ครบ

## A.4 Cleanup

```bash
npm uninstall mongoose  # ยังไม่ใช้ตอนนี้ — จะกลับมาใส่ใน Section D.2
```

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
1. ตัด branch จาก `dev`: `git checkout -b feature/payment-fix`
2. ทำงาน → commit
3. Push → เปิด **Pull Request**
4. อีกคน review → merge เข้า `dev`
5. ทดสอบ `dev` OK → merge `dev` → `main` → CI auto deploy

## B.2 Top 10 Git Tricks

### 1️⃣ Conventional Commits (เลิก "สฟสสฟ")

Format: `<type>(<scope>): <description>`

```bash
# ❌ Bad
git commit -m "fix"
git commit -m "สฟสสฟ"

# ✅ Good
git commit -m "feat(payment): add Omise webhook handler"
git commit -m "fix(booking): prevent double-booking"
git commit -m "refactor(auth): extract JWT to middleware"
git commit -m "docs(readme): add docker setup"
```

**Types:** `feat` `fix` `refactor` `docs` `test` `chore` `perf`

### 2️⃣ `.gitignore` Strict + `.env.example`

ดู Section A.1 ข้างบน

### 3️⃣ `git pull --rebase` (clean linear history)

```bash
# ตั้งให้เป็น default
git config --global pull.rebase true
```

### 4️⃣ VS Code 3-way Merge Editor

แทนการแก้ `<<<<<<<` ทีละบรรทัด — VS Code เปิด GUI ให้กดเลือก

Setting: search `merge.editor` → enable

### 5️⃣ Branch Naming Convention

```
feature/<description>     # New feature
fix/<description>         # Bug fix
chore/<description>       # Misc
hotfix/<description>      # Urgent prod fix
```

ตัวอย่าง: `feature/payment-omise-webhook`, `fix/booking-double-slot`

### 6️⃣ `git stash` (สลับ task ระหว่างทำงาน)

```bash
git stash                    # เก็บงานค้าง
git checkout main            # สลับไปทำอย่างอื่น
# ... fix bug ...
git checkout feature/mine    # กลับ branch เดิม
git stash pop                # คืนงานที่ค้าง
```

### 7️⃣ `git lg` Alias (ดู history แบบ visual)

```bash
git config --global alias.lg "log --oneline --graph --all --decorate"

# ใช้
git lg
```

### 8️⃣ Branch Protection (GitHub)

```
Settings → Branches → Add protection rule
  Branch: main
  ✅ Require pull request before merging
  ✅ Require approvals: 1
  ✅ Require status checks (CI pass)
  ✅ Require branches to be up to date
```

→ ห้ามใครก็ตาม push ตรง main

### 9️⃣ `.env.example` Pattern

Commit `.env.example` (ไม่มี secret value) — lalla `cp .env.example .env` แล้วกรอกค่าเอง

### 🔟 PR Template

`.github/pull_request_template.md`:

```markdown
## What
[ทำอะไร]

## Why
[ทำไม]

## Test
- [ ] Unit test pass
- [ ] Manual test ใน local

## Screenshot
[ถ้ามี UI change]
```

---

# Section C: DevOps

## C.1 Docker + docker-compose

### คือ:
Container — pack app + dependencies + OS เป็นกล่องเดียว

### ทำไม:

**แก้ปัญหา 3 ชั้น:**

| ชั้น | ปัญหา | Docker แก้ |
|---|---|---|
| 1 | nem ใช้ Node 20 / lalla ใช้ Node 18 → รันต่างกัน | ทุกคนได้ Node version เดียวกัน |
| 2 | DB schema ของ nem ≠ lalla | Mount migration script ใน container |
| 3 | "Works on my machine" | รัน `docker-compose up` = environment เหมือนเป๊ะ |

### ทำใน EV Charger:

**`Dockerfile` (backend):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

**`docker-compose.yml` (root):**
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

**ใช้:**
```bash
docker-compose up      # start ทุกอย่าง
docker-compose down    # stop
docker-compose logs -f backend  # ดู log
```

## C.2 GitHub Actions CI/CD

### ทำไม:
Push code → auto run test → auto deploy → no manual deploy

### ทำใน EV Charger:

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd backend && npm ci
      - run: cd backend && npm test
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
      # Deploy to Railway / Vercel webhook
      - run: curl -X POST ${{ secrets.RAILWAY_DEPLOY_HOOK }}
```

---

# Section D: Add Features

## D.1 Socket.io (Real-time + Admin↔Tech Chat)

### Use Cases ใน EV Charger:

1. **Real-time charger status** — admin/user เห็น available → in_use → charging update ทันที
2. **Live charging progress** — kWh, %, เวลาเหลือ — แทน polling
3. **Real-time queue position**
4. **Admin↔Tech chat** — ตอน assign ticket คุยกันได้

### ทำใน EV Charger:

**Backend (Express + Socket.io):**
```javascript
const { Server } = require('socket.io');
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket:${ticketId}`);
  });

  socket.on('chat_message', ({ ticketId, message, from }) => {
    io.to(`ticket:${ticketId}`).emit('new_message', { message, from, ts: Date.now() });
  });
});

// Real-time charger status update
function broadcastChargerStatus(chargerId, status) {
  io.emit('charger_status', { chargerId, status });
}
```

**Frontend (React):**
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000');

useEffect(() => {
  socket.emit('join_ticket', ticketId);
  socket.on('new_message', (msg) => setMessages(prev => [...prev, msg]));
  return () => socket.off('new_message');
}, [ticketId]);
```

## D.2 MongoDB Hybrid Logging

### ทำไม MongoDB เหมาะกับ log (5 เหตุผล)

| เหตุผล | Why |
|---|---|
| Schema flexible | log แต่ละ event มี field ต่าง (login → ip, payment → amount, error → stack) |
| Write-heavy | log เขียนเยอะ อ่านน้อย — Mongo handle ดี |
| Query/search | หา "user X ทำอะไรเมื่อ Y" ใน Mongo ง่ายกว่า file |
| Aggregation | นับ "error rate ใน 24 ชม." ทำใน 1 query |
| TTL index | log อายุ 30 วัน auto-delete |

### Hybrid Pattern (3 Transports)

```
Winston (logger)
  ├── console transport       → dev mode
  ├── file transport (daily)  → fallback ถ้า Mongo ล่ม
  └── MongoDB transport       → search + analytics
```

### ทำใน EV Charger:

**Install:**
```bash
npm install winston winston-mongodb winston-daily-rotate-file mongoose
```

**`utils/logger.js`:**
```javascript
const winston = require('winston');
require('winston-mongodb');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI,
      collection: 'app_logs',
      options: { useUnifiedTopology: true },
      expireAfterSeconds: 60 * 60 * 24 * 30, // 30 วัน TTL
    }),
  ],
});

module.exports = logger;
```

**ใช้:**
```javascript
const logger = require('./utils/logger');

logger.info('user_login', { userId: user.id, ip: req.ip });
logger.error('payment_failed', { error: err.message, bookingId });
```

### 4 Use Cases ใน EV Charger

1. **Application Logs** — info/warn/error (ที่คุย)
2. **Activity Log / Audit Trail** — user action timeline
3. **Notification History** — แต่ละ type field ต่าง
4. **Charger Telemetry** — temperature/kW over time (time-series)

---

# Section E: Production Hardening

## E.1 Security (Helmet + OWASP)

```bash
npm install helmet express-validator
```

```javascript
const helmet = require('helmet');
app.use(helmet());

// Validate input
const { body, validationResult } = require('express-validator');

app.post('/api/booking',
  body('chargerId').isInt(),
  body('startTime').isISO8601(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // ... proceed
  }
);
```

**OWASP Top 10 ที่ EV Charger ต้องเช็ค:**
- SQL injection → ใช้ parameterized query (mysql2 default)
- XSS → React escape default ✅
- CSRF → token-based auth ✅
- Sensitive data exposure → HTTPS + no log password
- Broken auth → JWT + bcrypt ✅

## E.2 Sentry (Error Monitoring)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

→ Error ทุก crash ส่ง email + stack trace เข้า Sentry dashboard

## E.3 Redis (Cache + Rate Limit)

```bash
npm install redis ioredis
```

```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Cache stations list
async function getStations() {
  const cached = await redis.get('stations:all');
  if (cached) return JSON.parse(cached);

  const stations = await db.query('SELECT * FROM stations');
  await redis.setex('stations:all', 300, JSON.stringify(stations)); // 5 min TTL
  return stations;
}
```

## E.4 BullMQ (Refactor Cron Jobs)

```bash
npm install bullmq
```

```javascript
const { Queue, Worker } = require('bullmq');

// แทน node-cron ที่รันทุก 1 นาทีเช็ค idle
const idleQueue = new Queue('idle-fee', { connection: redis });

// เมื่อ session start → schedule job เช็คใน 30 นาที
await idleQueue.add('check-idle', { sessionId }, { delay: 30 * 60 * 1000 });

// Worker
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

---

# Section F: Deploy

## F.1 Phase 1 — Vercel + Railway

**Frontend (Vercel):**
1. Push code ไป GitHub
2. ไป vercel.com → Import project → เลือก repo → set root = `frontend/`
3. Add env var (REACT_APP_API_URL)
4. Deploy → ได้ URL `*.vercel.app`

**Backend + DB (Railway):**
1. railway.app → New Project → Deploy from GitHub
2. เลือก root = `backend/`
3. Add MySQL service + Redis service + MongoDB service
4. Set env var (DATABASE_URL, REDIS_URL, MONGO_URI auto provide)
5. Deploy → ได้ URL `*.railway.app`

**Update frontend:**
- Update REACT_APP_API_URL = backend Railway URL
- Redeploy

## F.2 Phase 2 — AWS Migration (หลัง Phase 1 เสถียร)

**AWS Stack:**
- **EC2** — t2.micro (free tier) สำหรับ Node app
- **RDS** — MySQL managed
- **DocumentDB** หรือ **MongoDB Atlas** — สำหรับ Mongo
- **ElastiCache** — Redis managed
- **S3** — file uploads (test_evidence รูป)
- **CloudWatch** — logs + monitoring
- **Route 53** — DNS (ซื้อ domain)
- **Certbot** — SSL fr ee

**ลำดับ:**
1. Setup VPC + Security Groups
2. Launch EC2 + install Docker
3. Setup RDS + import schema
4. Setup ElastiCache Redis
5. Setup MongoDB Atlas (free tier)
6. Setup S3 bucket + IAM role
7. Deploy via Docker Compose บน EC2
8. Setup Nginx reverse proxy + Let's Encrypt SSL

---

# Section G: Mobile (nem only)

## Capacitor Wrap → .apk

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "EV Charger" "com.nem.evcharger"

# Build React first
npm run build

# Add Android
npx cap add android
npx cap copy android
npx cap open android  # เปิด Android Studio → Build APK
```

→ ได้ไฟล์ `.apk` ติดตั้งบนมือถือจริง + ขึ้น Google Play ได้

---

# 🤝 ส่วนที่ต้องคุยกับ lalla

1. **Schema migration** — รัน `LALLA_MIGRATION.sql` + tables ใหม่ของ lalla เอง
2. **Docker setup** — ลง Docker Desktop + รัน `docker-compose up`
3. **Git workflow change** — เปลี่ยนจาก push main ตรง → feature branch + PR
4. **MongoDB integration** — กระทบ schema (เพิ่ม collection)
5. **แบ่งงาน** — ใครทำอันไหนใน Phase 1

---

# 📖 Resources

- **Docker:** docker.com docs + "Docker Deep Dive" by Nigel Poulton
- **GitHub Actions:** docs.github.com/en/actions
- **Conventional Commits:** conventionalcommits.org
- **OWASP Top 10:** owasp.org/www-project-top-ten
- **Socket.io:** socket.io/docs/v4
- **Winston:** github.com/winstonjs/winston
- **BullMQ:** docs.bullmq.io
- **AWS Free Tier:** aws.amazon.com/free
- **Capacitor:** capacitorjs.com/docs
