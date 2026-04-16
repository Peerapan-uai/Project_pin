# Tech Guide — EV Charger Project
> สิ่งที่ต้องรู้ทั้งหมดแยกตาม tech stack — ไว้อ่านก่อนสอบ/present
> อัปเดตล่าสุด: 2026-04-16

---

## 1. Frontend — React + Vite + Tailwind CSS

> nem รู้น้อยถึงน้อยมากเรื่อง React — ส่วนนี้สำคัญที่สุดที่ต้องอ่าน

### 1.1 React พื้นฐาน (nem + lalla)
| หัวข้อ | ทำไมต้องรู้ | ค้นหา |
|--------|------------|-------|
| **Component & JSX** | ทุกหน้าใน project เป็น React component | `"React component JSX tutorial"` |
| **Props vs State** | props = ข้อมูลจากข้างนอก, state = ข้อมูลภายใน component | `"React props vs state explained"` |
| **useState** | ใช้ทุกหน้า เช่น `const [loading, setLoading] = useState(false)` | `"React useState hook tutorial"` |
| **useEffect** | ดึง API ตอน component โหลด, cleanup ตอน unmount | `"React useEffect explained"` |
| **useRef** | เก็บค่าที่ไม่ต้อง re-render เช่น map instance, interval ID | `"React useRef vs useState"` |
| **Conditional Rendering** | แสดง/ซ่อน UI ตาม state เช่น `{loading && <Spinner/>}` | `"React conditional rendering"` |
| **List Rendering (.map)** | แสดง list เช่น bookings, stations | `"React rendering lists key prop"` |

### 1.2 React ขั้นกลาง (nem + lalla)
| หัวข้อ | ใช้ตรงไหนในโปรเจค | ค้นหา |
|--------|------------------|-------|
| **useEffect cleanup** | ChargingPage: clearInterval, clearWatch GPS ตอน unmount | `"React useEffect cleanup function"` |
| **Stale Closure** | setInterval ใน ChargingPage เห็นค่า state เก่า → ใช้ functional update `prev => prev + 1` | `"React stale closure setInterval fix"` |
| **React Context (useContext)** | `AuthContext.jsx` — เก็บ user/token ให้ทุกหน้าเข้าถึงได้ | `"React context API tutorial"` |
| **React Router v6** | `AppRouter.jsx` — route, navigate, useParams, useNavigate, useLocation | `"React Router v6 tutorial"` |
| **Protected Routes** | `RoleRoute` — เช็ค role ก่อนเข้าหน้า admin/tech | `"React Router protected routes"` |
| **Code Splitting (lazy)** | `React.lazy()` + `Suspense` — โหลด page เฉพาะตอนเข้า (nem) | `"React lazy loading code splitting"` |
| **Controlled Forms** | ทุก form ใน project (login, register, payment) ใช้ state ควบคุม input | `"React controlled vs uncontrolled forms"` |

### 1.3 React ขั้นสูง (ถ้ามีเวลา)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **AbortController** | ยังไม่มีในโปรเจค แต่ควรใส่ — cancel fetch ตอน unmount | `"React useEffect AbortController fetch"` |
| **ErrorBoundary** | ยังไม่มี — จับ error ตอน lazy load fail | `"React error boundary tutorial"` |
| **useMemo / useCallback** | optimize re-render — ยังไม่จำเป็นตอนนี้ | `"React useMemo useCallback when to use"` |

### 1.4 Vite (nem + lalla)
| หัวข้อ | ทำไมต้องรู้ | ค้นหา |
|--------|------------|-------|
| **Vite คืออะไร** | build tool ที่ใช้แทน Create React App — เร็วกว่ามาก | `"Vite React tutorial"` |
| **Environment Variables** | `import.meta.env.VITE_xxx` — ใช้เก็บ API key | `"Vite environment variables .env"` |
| **Dev Server + HMR** | `npm run dev` → auto-reload ตอนแก้ code | `"Vite HMR hot module replacement"` |

### 1.5 Tailwind CSS (nem + lalla)
| หัวข้อ | ทำไมต้องรู้ | ค้นหา |
|--------|------------|-------|
| **Utility-first CSS** | ทุกหน้าใช้ Tailwind เช่น `className="bg-blue-500 p-4 rounded"` | `"Tailwind CSS tutorial for beginners"` |
| **Responsive** | `sm:`, `md:`, `lg:` prefix | `"Tailwind CSS responsive design"` |
| **Flexbox/Grid** | `flex`, `grid`, `gap`, `justify-center`, `items-center` | `"Tailwind CSS flexbox grid"` |

### 1.6 Libraries ที่ใช้ (Frontend)
| Library | ใช้ทำอะไร | ใครใช้ | ค้นหา |
|---------|----------|--------|-------|
| **axios** | เรียก API (ใช้แทน fetch) — มี interceptor สำหรับ auto-logout | nem + lalla | `"Axios React tutorial interceptors"` |
| **react-router-dom v6** | จัดการ routing ทั้งหมด | nem + lalla | `"React Router v6 tutorial"` |
| **@react-google-maps/api** | แสดงแผนที่ Google Maps + markers | nem | `"@react-google-maps/api tutorial"` |
| **react-icons** | icon ต่างๆ ในหน้า UI | nem + lalla | `"React Icons usage"` |
| **qrcode.react** | แสดง QR code PromptPay | nem | `"qrcode.react tutorial"` |
| **Omise.js (CDN)** | tokenize บัตรเครดิต (ไม่ผ่าน server เรา) | nem | `"Omise.js frontend integration"` |

---

## 2. Backend — Node.js + Express

> nem รู้เยอะอยู่ แต่อ่านเพื่อกันพลาด

### 2.1 Express พื้นฐาน (nem + lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **Express Router** | ทุก route file ใช้ `express.Router()` | `"Express Router tutorial"` |
| **Middleware** | auth, logger, roleCheck, cors, morgan | `"Express middleware explained"` |
| **Request/Response** | `req.body`, `req.params`, `req.query`, `req.user`, `res.json()`, `res.status()` | `"Express req res object"` |
| **Error Handling** | try/catch ในทุก route, error middleware | `"Express error handling best practices"` |
| **Route Ordering** | Express จับ route แรกที่ match — `/all` ต้องอยู่ก่อน `/:id` | `"Express route order matters"` |

### 2.2 Authentication & Security (nem + lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **JWT (JSON Web Token)** | login → สร้าง token, ทุก request ส่ง token ใน header | `"JWT authentication Node.js Express"` |
| **bcryptjs** | hash password ตอน register, compare ตอน login | `"bcryptjs hash password Node.js"` |
| **Auth Middleware** | `middleware/auth.js` — verify token ทุก request | `"Express JWT middleware"` |
| **Role-based Access Control** | `middleware/roleCheck.js` — เช็ค admin/technician/user | `"Express role-based access control RBAC"` |
| **CORS** | `cors()` — อนุญาต frontend เรียก API cross-origin | `"Express CORS explained"` |

### 2.3 Database Integration (nem + lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **mysql2 Connection Pool** | `config/db.js` — reuse connection ไม่สร้างใหม่ทุกครั้ง | `"mysql2 connection pool Node.js"` |
| **Prepared Statements** | ทุก query ใช้ `?` placeholder ป้องกัน SQL injection | `"mysql2 prepared statements"` |
| **Transaction** | wallet topup/deduct ใช้ `beginTransaction`, `commit`, `rollback` | `"MySQL transaction Node.js"` |
| **FOR UPDATE (Row Lock)** | ล็อค row ตอน SELECT ป้องกัน race condition (wallet) | `"MySQL SELECT FOR UPDATE explained"` |
| **Mongoose (MongoDB)** | `models/Log.js` — define schema, create, find | `"Mongoose Node.js tutorial"` |

### 2.4 Payment (nem)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **Omise API** | สร้าง charge, refund, manage customer/cards | `"Omise Node.js integration"` |
| **PromptPay QR** | generate QR จากเบอร์โทร + จำนวนเงิน | `"promptpay-qr npm"` |
| **Webhook** | Omise ส่ง event กลับมาบอกว่า charge สำเร็จ/ล้มเหลว | `"Omise webhook Node.js"` |
| **Omise test vs live** | test key (`pkey_test_`) ไม่หักเงินจริง, live key หักจริง | `"Omise test mode vs live mode"` |

### 2.5 Background Jobs (nem)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **node-cron** | `jobs/expireBookings.js`, `jobs/expirePayments.js` — รันทุก 1 นาที | `"node-cron tutorial"` |
| **Scheduled Notifications** | lalla ใช้ node-cron ส่ง notification ตามเวลา | `"node-cron scheduled tasks"` |

### 2.6 File Upload & Export (lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **Multer** | upload รูป repair_image ใน tickets | `"Multer file upload Express"` |
| **@json2csv/node** | export CSV + withBOM สำหรับ Excel ภาษาไทย | `"@json2csv/node tutorial"` |
| **Puppeteer** | generate PDF invoice (รองรับภาษาไทย) | `"Puppeteer generate PDF Node.js"` |

### 2.7 API Documentation (nem + lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **Swagger (OpenAPI)** | `swagger-jsdoc` + `swagger-ui-express` — auto-generate API docs | `"Swagger Express tutorial swagger-jsdoc"` |
| **JSDoc comments** | เขียน `/** @swagger */` comment เหนือ route | `"swagger-jsdoc annotations"` |

### 2.8 Performance Optimization (nem — ยังไม่ได้ทำ)
| หัวข้อ | ปัญหาในโปรเจค | ค้นหา |
|--------|--------------|-------|
| **Promise.all()** | sessions/stop ยิง 3 queries ทีละอัน → ยิงพร้อมกัน | `"JavaScript Promise.all parallel queries"` |
| **SQL JOIN** | chargers GET /:id query 2 รอบ → รวมเป็น JOIN เดียว | `"MySQL JOIN tutorial"` |
| **Pagination (LIMIT/OFFSET)** | notifications + bookings ดึงทั้งหมดไม่มี LIMIT | `"MySQL pagination LIMIT OFFSET"` |
| **N+1 Query Problem** | query ใน loop = ช้า → ใช้ JOIN หรือ batch query | `"N+1 query problem solution"` |

---

## 3. Database — MySQL + MongoDB

> nem + lalla รู้พอสมควร แต่อ่านเพื่อกันพลาด

### 3.1 MySQL พื้นฐาน (nem + lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **CREATE TABLE + Data Types** | `schema.sql` — INT, VARCHAR, DECIMAL, ENUM, TIMESTAMP | `"MySQL data types tutorial"` |
| **PRIMARY KEY + AUTO_INCREMENT** | ทุก table ใช้ `xxx_id INT UNSIGNED AUTO_INCREMENT` | `"MySQL primary key auto increment"` |
| **FOREIGN KEY** | เชื่อม table เช่น `bookings.user_id → users.user_id` | `"MySQL foreign key tutorial"` |
| **ENUM** | จำกัดค่าที่ใส่ได้ เช่น `status ENUM('pending','confirmed','cancelled')` | `"MySQL ENUM type"` |
| **DEFAULT + NOT NULL** | กำหนดค่าเริ่มต้น + บังคับว่าห้ามเป็น null | `"MySQL DEFAULT NOT NULL constraint"` |

### 3.2 MySQL ขั้นกลาง (nem + lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **JOIN (INNER, LEFT)** | ดึงข้อมูลข้าม table เช่น bookings + chargers + stations | `"MySQL JOIN types explained"` |
| **Aggregate (COUNT, SUM, AVG)** | dashboard stats, reports revenue | `"MySQL aggregate functions"` |
| **GROUP BY + HAVING** | reports แยกตามสถานี/เดือน | `"MySQL GROUP BY HAVING"` |
| **Subquery** | query ซ้อน query | `"MySQL subquery tutorial"` |
| **INDEX** | เพิ่มความเร็ว query — 12 indexes ในโปรเจค | `"MySQL index explained B-tree"` |
| **Transaction (BEGIN/COMMIT/ROLLBACK)** | wallet topup/deduct ต้องอัพเดทหลาย table แบบ atomic | `"MySQL transaction ACID"` |
| **FOR UPDATE (Row Locking)** | ล็อค row ระหว่าง transaction ป้องกัน race condition | `"MySQL SELECT FOR UPDATE row locking"` |

### 3.3 MySQL ขั้นสูง (ถ้ามีเวลา)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **EXPLAIN** | วิเคราะห์ว่า query ช้าเพราะอะไร (full table scan?) | `"MySQL EXPLAIN query plan"` |
| **CHECK Constraint** | จำกัดค่า เช่น `rating BETWEEN 1 AND 5`, `wallet_balance >= 0` | `"MySQL CHECK constraint"` |
| **Spatial Index** | ค้นหาสถานีใกล้เคียงด้วย lat/lng (Haversine) | `"MySQL spatial index latitude longitude"` |
| **ALTER TABLE** | เปลี่ยน schema โดยไม่ต้อง drop table (ใช้บ่อยในโปรเจคนี้) | `"MySQL ALTER TABLE ADD COLUMN MODIFY"` |

### 3.4 MongoDB (lalla เป็นหลัก, nem ใช้ทางอ้อม)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **MongoDB vs MySQL** | ทำไมใช้ MongoDB เก็บ log แทน MySQL | `"MongoDB vs MySQL when to use"` |
| **Document / Collection** | MongoDB เก็บ JSON document แทน row, collection แทน table | `"MongoDB documents collections"` |
| **Mongoose Schema** | `models/Log.js` — define โครงสร้าง document | `"Mongoose schema tutorial"` |
| **CRUD Operations** | `Log.create()`, `Log.find()`, `Log.findOne()` | `"Mongoose CRUD operations"` |
| **TTL Index** | auto-delete log เก่าเกิน 90 วัน | `"MongoDB TTL index auto delete"` |
| **Index** | เพิ่มความเร็ว query เช่น `userId_1`, `statusCode_1` | `"MongoDB index tutorial"` |

### 3.5 Docker (nem + lalla)
| หัวข้อ | ใช้ตรงไหน | ค้นหา |
|--------|----------|-------|
| **Docker Compose** | `docker-compose.yml` — รัน MySQL + MongoDB + phpMyAdmin + Mongo Express | `"Docker Compose tutorial"` |
| **Container vs Image** | image = แม่พิมพ์, container = instance ที่รันจริง | `"Docker container vs image"` |
| **Volumes** | `mysql_data`, `mongo_data` — เก็บข้อมูล DB ไม่หายตอน restart | `"Docker volumes persistent data"` |
| **Port Mapping** | `3307:3306` = host port 3307 → container port 3306 | `"Docker port mapping explained"` |
| **docker compose up/down** | start/stop ทุก service พร้อมกัน | `"Docker Compose commands"` |

---

## 4. Tools & Workflow

### 4.1 Development Tools (nem + lalla)
| Tool | ใช้ทำอะไร | ค้นหา |
|------|----------|-------|
| **Git** | version control — branch, commit, pull, push, merge | `"Git basics tutorial"` |
| **phpMyAdmin** | GUI จัดการ MySQL (port 8081) | `"phpMyAdmin tutorial"` |
| **Mongo Express** | GUI จัดการ MongoDB (port 8082) | `"Mongo Express tutorial"` |
| **MongoDB Compass** | GUI จัดการ MongoDB (desktop app) | `"MongoDB Compass tutorial"` |
| **Swagger UI** | ทดสอบ API ผ่าน browser (port 5000/api-docs) | `"Swagger UI tutorial"` |
| **Nodemon** | auto-restart server ตอนแก้ code | `"Nodemon Node.js"` |

### 4.2 Testing & Debugging (nem + lalla)
| หัวข้อ | ค้นหา |
|--------|-------|
| **Postman / Swagger** — ทดสอบ API | `"Postman API testing tutorial"` |
| **Chrome DevTools — Network tab** — ดู request/response | `"Chrome DevTools network tab"` |
| **Chrome DevTools — Console** — ดู error | `"Chrome DevTools console debugging"` |
| **React DevTools** — ดู component tree, state, props | `"React DevTools tutorial"` |
| **console.log debugging** — วิธีง่ายที่สุด | `"JavaScript debugging console.log"` |

---

## 5. แนวทางอ่าน — เรียงตามความสำคัญ

### nem (รู้ BE เยอะ, รู้ React น้อยมาก)
```
ลำดับ 1 (สำคัญสุด):
  → React พื้นฐาน: useState, useEffect, Props/State, JSX
  → React Router v6: route, navigate, useParams
  → Tailwind CSS พื้นฐาน

ลำดับ 2 (สำคัญ):
  → useEffect cleanup + Stale Closure (bug ที่เจอจริงในโปรเจค)
  → React Context (AuthContext)
  → Code Splitting (lazy/Suspense)

ลำดับ 3 (กันพลาด):
  → Transaction + FOR UPDATE (ใช้ใน wallet แล้ว)
  → Omise test vs live mode
  → Performance: Promise.all, JOIN, Pagination

ลำดับ 4 (ถ้ามีเวลา):
  → AbortController, ErrorBoundary
  → MySQL EXPLAIN
  → Webhook signature verification
```

### lalla (รู้ DB + admin, อาจพลาด React + Express patterns)
```
ลำดับ 1 (สำคัญสุด):
  → React พื้นฐาน: useState, useEffect, Props/State
  → Express route ordering (bug ที่เจอจริง)
  → Tailwind CSS

ลำดับ 2 (สำคัญ):
  → Multer file upload
  → Puppeteer PDF generation
  → @json2csv/node CSV export

ลำดับ 3 (กันพลาด):
  → MongoDB TTL Index, Mongoose CRUD
  → MySQL Transaction, INDEX
  → Docker Compose

ลำดับ 4 (ถ้ามีเวลา):
  → MySQL CHECK constraint
  → Spatial Index (Haversine)
  → React Context, Protected Routes
```

---

## 6. Quick Reference — คำสั่งที่ใช้บ่อย

### รัน Project
```bash
# Start Docker (MySQL + MongoDB)
docker compose up -d

# Start Backend
cd backend && npm run dev

# Start Frontend
cd frontend && npm run dev
```

### URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Swagger | http://localhost:5000/api-docs |
| phpMyAdmin | http://localhost:8081 |
| Mongo Express | http://localhost:8082 |

### Git
```bash
git pull origin master      # ดึงของใหม่
git add <files>             # stage files
git commit -m "message"     # commit
git push origin master      # push
git stash && git pull       # เก็บของที่แก้ค้าง แล้ว pull
```
