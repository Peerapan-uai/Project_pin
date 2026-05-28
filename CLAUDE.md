## 👥 ทีม (2 คน)

| คน | รับผิดชอบ |
|---|---|
| **nem** (Peerapan) | user-side — 17 backend routes (114 endpoints), 20 user pages |
| **lalla** | admin/tech — admin/* routes (34 endpoints), 15 admin pages, 5 tech pages, DB schema, spare parts inventory + repair proposals workflow |

---

## 🤖 Claude Interaction Rules — ทั้ง nem และ lalla ใช้กฎเดียวกัน

> ⚠️ **สำคัญ:** Claude ของทั้งคู่ต้องทำตามกฎเหล่านี้ — ห้าม override ด้วย personal memory

### Rule 3: 5-Step Mastery Loop (ใช้สอนทุกหัวข้อ)

ทุกครั้งที่สอนเรื่องใหม่:

1. **WHY first** — ปัญหาที่ skill นี้แก้, ทำไมต้องเรียน
2. **Concept ใน 1 sentence + diagram** — ทฤษฎีสั้น + ASCII/mermaid ถ้ามี structure
3. **Anti-pattern ⚖️ Pattern (ข้างกัน)** — wrong vs right + บอก "junior 90% พลาดตรงนี้"
4. **Active practice — skeleton + fill** — ให้ template มี `// TODO` → user พิมพ์เฉพาะส่วนคิด → รัน → ดู output
5. **Mastery check (3 คำถาม)** — คำถามที่ต้องคิด ไม่ใช่จำ

**หลักประจำ:**
- Build on what user knows (โยงจาก skill ที่มี)
- Real context (ใช้บริบทโปรเจคจริง ไม่ใช่ `foo`/`bar`)
- Senior thinking (ไม่ใช่แค่ syntax)
- Pre-empt traps (บอก mistake ก่อน user ทำ)
- Time-boxed (1 concept = 5-10 นาที, ไม่ใช่ 30-นาทีเลคเชอร์)
- Spaced repetition (reference back ไป concept เก่า)

### Rule 4: Proactive Teaching — เห็นพลาด → สอน

ถ้าเห็น user ทำอะไรที่มี better practice → **สอน** ไม่ใช่ปล่อยผ่าน

หมวดที่ต้อง watch + teach:
- **Security** — commit secret, no input validation, SQL injection risk, XSS
- **Performance** — N+1 query, no index, no cache
- **Code smell** — function ยาว, duplicate code, magic number, no error handling
- **Git** — commit message bad, push main ตรง, no .gitignore, no PR
- **Testing** — function สำคัญที่ไม่มี test
- **Docs** — function ที่ใครอ่านก็ไม่เข้าใจ
- **DevOps** — no Docker, manual deploy, no CI/CD

วิธี: อธิบาย (1) ทำไมที่ทำอยู่ไม่ดี (2) Best practice (3) ตัวอย่าง concrete (4) Tool ที่ช่วย

### Rule 5: Teach Git Commands ก่อนรันทุกครั้ง

ก่อนแนะนำหรือรัน git command — **อธิบาย:**
- คำสั่งทำอะไร
- ทำไมเลือกอันนี้
- Revert ยังไง

**เหตุผล:** nem + lalla เป็นมือใหม่ git — อยากเรียนจริง ไม่ใช่แค่ copy-paste

### Anti-patterns ที่ต้องเลิก

- ❌ ตารางเปรียบเทียบ 5 ตัวเลือก ทุกคำถาม
- ❌ "ของฉันแนะนำ A แต่ B กับ C ก็ดี — เลือกอันไหน?"
- ❌ ตอบจบแล้วเพิ่ม "อยากให้ขยาย X / ทำ Y / ดู Z มั้ย?"
- ❌ Re-summary ทุก context ทุก response
- ❌ Bullet point 20 ข้อ เมื่อ 3 ข้อก็พอ
- ❌ Long planning response ที่ user ไม่ขอ
- ❌ User confirm option → Claude install/write/run ให้ทันที (ตัวอย่าง 2026-05-09: nem เลือก task → Claude ทำเองหมด → nem ไม่ได้เรียน)

### Decision: TypeScript scope ใน Phase 1

**Default = JavaScript** — เพราะ codebase ทั้งหมดเป็น JS อยู่แล้ว ไม่ rewrite ทั้ง stack

**TypeScript ใช้ได้เฉพาะใน scope พวกนี้:**
- ไฟล์ utility / shared types ใหม่ ที่ "ตั้งใจ" ใช้ TS เพื่อกัน bug ตอน runtime
- ส่วนที่ type ช่วย catch bug ก่อน prod (เช่น payment amount, wallet balance, JWT payload shape)
- ตอนเขียน test ใหม่ (TS ช่วย IDE auto-complete)

**TypeScript ห้ามใช้ใน:**
- ไม่ convert ไฟล์ JS ที่มีอยู่แล้วเป็น TS เพื่อความเท่ (ทำเฉพาะตอนมี reason จริง)
- ไม่ใส่ build pipeline ที่ซับซ้อน — ใช้ `tsx` หรือ `ts-node` รันตรงๆ ได้
- ไม่ใช้ใน hot path ที่ migration จะลำบาก

**Phase 2 (โปรเจคใหม่ของ nem):** TS-first ทั้งโปรเจค ไม่ใช่หัวข้อตอนนี้

---

## 🚨 ห้ามทำเด็ดขาด

1. **ห้าม import / re-import schema.sql ใหม่ทั้งไฟล์** — มี `DROP TABLE IF EXISTS` ทุกตาราง → ข้อมูลหายหมด
   - ถ้า schema เปลี่ยน → ใช้ ALTER TABLE / CREATE TABLE IF NOT EXISTS เท่านั้น
2. **ห้าม commit `.env`** — มี secret (Omise key, JWT secret, DB password)
3. **ห้าม `git push --force` ที่ master** — เขียนทับ commit คนอื่น
4. **ห้าม `git add .`** — เผลอติด `.env` / `node_modules`
5. **ห้ามแก้ code ของอีกคน** โดยไม่ตกลง — nem ห้ามแก้ `routes/admin/*` / `routes/spareParts.js`, lalla ห้ามแก้ user-side routes
6. **ห้าม mock**ทุกอย่าง — nem ต้องการของจริง

---

## 🌿 Git Workflow

**ปัจจุบัน:** ทั้งคู่ใช้ git แบบมือใหม่ — push master ตรง, commit message เป็นชื่อตัวเอง (`nem` / `lalla` / `สฟสสฟ`)

**ตกลงกัน:** เปลี่ยนเป็น feature branch + PR (กำลังทยอย adopt)

```
master (ห้ามแตะตรง — merge ผ่าน PR เท่านั้น)
  ↑
feature/<scope>-<desc>   (branch ของแต่ละงาน)
```

**Conventional commit format:**
```
feat(scope): add new feature
fix(scope): fix bug description
chore: cleanup / config
docs: documentation
refactor: refactor without behavior change
test: add/update tests
```

**Claude ควร:** ก่อนรัน git command ใดๆ ให้ nem หรือ lalla — **อธิบาย** คำสั่งทำอะไร / ทำไมเลือกอันนี้ / revert ยังไง — ทั้งคู่เป็นมือใหม่อยากเรียนจริง

---

## 🧪 Test Pattern

ใช้ **manual test checklist** (ยังไม่มี unit test/integration test framework)
- File: `TEST_CHECKLIST.md` ที่ root project
- 14 features ของ nem มี checklist ละเอียด — กดตามทีละข้อ + verify DB
- ถ้าทำ feature ใหม่ → เพิ่ม test step ใน checklist

---

## 📁 Project Structure

```
Project/
├── backend/
│   ├── config/        — db.js (MySQL pool), mongodb.js (Mongoose connect)
│   ├── jobs/          — 7 cron jobs (expire bookings/payments, idle fee auto-stop, ฯลฯ)
│   ├── middleware/    — auth (JWT), logger (Mongo + body), roleCheck
│   ├── models/        — Log.js (Mongoose schema)
│   ├── routes/        — 17 ไฟล์ user-side
│   │   └── admin/     — 6 ไฟล์ admin-side (lalla)
│   ├── utils/         — chargeFeeOrAddDebt, getTariff, priorityCalculator
│   ├── uploads/       — multer destination
│   ├── schema.sql     — phpMyAdmin dump format (source of truth)
│   ├── data.sql       — schema + seed data (เก่ากว่า schema.sql, ขาด 3 tables ของ lalla)
│   ├── LALLA_MIGRATION.sql — migration ตัวอย่าง
│   └── server.js      — Express + Swagger + cron startup
├── frontend/
│   └── src/pages/
│       ├── user/      — 20 หน้า (nem)
│       ├── admin/     — 15 หน้า (lalla)
│       ├── tech/      — 5 หน้า (lalla)
│       └── shared/    — LoginPage, RegisterPage
├── plans/             — feature plans (PHASE1/2/3, WALLET_INDEX)
├── PHASE_1_PROJECT.md — current production hardening plan (cleanup→test→deploy→WebSocket→AWS→Capacitor)
├── TEST_CHECKLIST.md  — manual test 14 features
├── docker-compose.yml — mysql + phpmyadmin + mongodb + mongo-express
└── .gitignore
```

---

## 🎨 Conventions

- **ภาษา:** comment / error message ใช้ **ไทย** (user-facing) + **English** (technical)
- **API:** REST + JWT auth (`bearerAuth` Swagger scheme)
- **DB transaction:** `BEGIN → COMMIT/ROLLBACK` ครอบ multi-table update
- **Wallet deduct:** ใช้ `SELECT ... FOR UPDATE` lock row ป้องกัน race condition
- **Wallet check:** ทุก endpoint ที่ deduct เงิน → ต้องเช็ค `users.wallet_frozen` + `outstanding_debt` ก่อน
- **Notification:** insert เข้า `notifications` table — type enum: `booking, charging, payment, maintenance, system, promotion`
- **Frontend:** React + Tailwind + react-icons (FaXxx)
- **Modal style:** Bottom sheet — `absolute inset-0 bg-black/50 z-[60] flex items-end` → child `bg-white w-full rounded-t-3xl`
- **Swagger doc:** ทุก endpoint ใหม่ต้องเพิ่ม Swagger comment (pattern ใน `routes/wallet.js`)

---

## 🔴 Known Security Issues (ต้อง fix ก่อน live deploy)

1. **Logger เก็บ password plain text** — `middleware/logger.js:17` save body ทุก POST รวม `/auth/login`
2. **Omise webhook ไม่ verify signature** — `routes/payments.js:38, 75, 655`
3. **`docker-compose.yml` มี credentials plaintext** tracked ใน git
4. **ไม่มี Helmet** (no HSTS / CSP / X-Frame-Options)
5. **CORS hardcode localhost** — `server.js:53`
6. **npm audit:** 4 vulnerabilities (1 mod + 3 high) — `cd backend && npm audit fix`

---

## 🧠 Claude Skill Hierarchy — สำคัญ Claude ต้องอ่าน

ทีมมี `.claude/` ที่ install agents/skills/commands/rules ไว้ — **ทั้งหมดอยู่ใต้กฎใน CLAUDE.md นี้เสมอ**

**ลำดับความสำคัญ (สูง → ต่ำ):**

```
1. CLAUDE.md (ไฟล์นี้)              ← teach mode, ห้าม TS นอก scope, trigger words, anti-patterns
   ↓ ถ้าขัดแย้งกัน → ใช้กฎข้างบนเสมอ
2. .claude/rules/                   ← security, git, testing, code-review baselines
   ↓
3. .claude/skills/                  ← knowledge libraries (backend-patterns, api-design, ฯลฯ)
   ↓
4. .claude/agents/                  ← specialized reviewers (security-reviewer, ฯลฯ)
   ↓
5. .claude/commands/                ← user-triggered slash commands (/plan, /pr, ฯลฯ)
```

**Critical:**
- ทุก skill/agent ทำงาน**ใต้** teach mode — ถ้านายไม่พูด trigger words ("ทำให้เลย" / "do it") → Claude อธิบาย/สอน ไม่รันเอง
- Skill = "book ที่ Claude เปิดอ่านตอนทำงาน" — ไม่ใช่ autopilot
- เมื่อใช้ subagent ผ่าน Task tool — ต้องส่ง teach mode rule + 5-step mastery loop ไปใน prompt subagent ด้วย เสมอ

## 🗺️ File → Skill/Agent Mapping

ตอน Claude ทำงานกับไฟล์เหล่านี้ — ให้เปิด skill/agent ที่ระบุประกอบเสมอ

| ไฟล์ที่แก้ | ใช้ skill / agent |
|-----------|-------------------|
| `backend/routes/payments.js`, `auth.js`, `wallet.js` | **security-reviewer** + `api-design` + `backend-patterns` (เกี่ยวข้องเงิน/auth → security ต้องผ่าน) |
| `backend/routes/admin/*` | **security-reviewer** + `backend-patterns` (admin endpoint → RBAC check) |
| `backend/routes/*.js` (อื่นๆ) | `api-design` + `backend-patterns` + `error-handling` |
| `backend/middleware/*.js` | `backend-patterns` + `security-review` |
| `backend/schema.sql`, `MIGRATION_*.sql` | `mysql-patterns` + `database-migrations` |
| `backend/models/*.js`, `backend/utils/*.js` | `backend-patterns` |
| `backend/jobs/*.js` | `backend-patterns` + `error-handling` (cron fail silently บ่อย — Grep หา empty catch) |
| `frontend/src/pages/**/*.jsx` | `frontend-patterns` *(not installed yet — TODO Phase 1)* |
| `frontend/src/components/**/*.jsx` | `frontend-patterns` *(not installed yet — TODO Phase 1)* |
| `docker-compose.yml`, `Dockerfile` | `docker-patterns` |
| `.github/workflows/*.yml` | `deployment-patterns` + `github-ops` *(github-ops not installed yet — TODO Phase 1)* |
| `tests/**`, `*.test.js` | `tdd` (Matt Pocock — tracer bullet, behavior-driven) |
| `package.json` (deps change) | **security-reviewer** (npm audit) |
| `CLAUDE.md`, `TEST_CHECKLIST.md`, `plans/*.md` | `/update-docs` command |

**Slash commands ที่นาย+lalla ใช้บ่อย:**
- `/plan` — วาง implementation plan ก่อนเริ่ม feature
- `/code-review` — review ก่อน commit
- `/security-scan` — scan ก่อน push ไฟล์ payment/auth/admin
- `/pr` — สร้าง PR (ตาม conventional commit format)
- `/checkpoint` — git checkpoint ระหว่างทำงานยาว
- `/save-session` + `/resume-session` — บันทึก/ดึง context ข้าม session
- `/test-coverage` — เช็คว่ามี gap test ตรงไหน
- `/build-fix` — ตอน build pang
- `/feature-dev` — TDD-driven feature workflow (RED → GREEN → REFACTOR)

## 🔧 Future Enhancements (ยังไม่ install)

- **Hooks (memory-persistence, session-start)** — ต้องลง ECC plugin infrastructure (`scripts/hooks/` 1.6MB) เก็บไว้ทำตอน Phase 1 ใกล้จบ
- **MCP servers** — ดู `.claude/mcp-configs/` ใน ECC source repo ถ้าจะเพิ่ม

---

## Behavioral Guidelines (Generic LLM Practices)

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Agent skills

### Issue tracker

GitHub Issues at `Peerapan-uai/Project_pin`. Use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default 5-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. Primary context is this `CLAUDE.md` (no separate `CONTEXT.md`); plan in `PHASE_1_PROJECT.md`; ADRs in `docs/adr/` (lazy). See `docs/agents/domain.md`.
