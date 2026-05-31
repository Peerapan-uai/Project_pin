# CLAUDE.md — Project Context for Claude Code

> ไฟล์นี้ Claude อ่านอัตโนมัติเมื่อเปิด Claude Code ในโฟลเดอร์ project.
> Update เมื่อ workflow / decision / convention เปลี่ยน.

---

## 📌 Project Overview

**EV Charging Station Booking** (CSI401 Capstone → production-grade portfolio) — React (Vite) + Node.js (Express) + MySQL + MongoDB (logging) + Omise (payment) + Google Maps.

**Default ใช้ JavaScript** — TypeScript scope ดู [ADR 0001](docs/adr/0001-typescript-scope.md).

## 👥 ทีม (2 คน)

| คน | รับผิดชอบ |
|---|---|
| **nem** (Peerapan) | user-side — 17 backend routes (114 endpoints), 20 user pages |
| **lalla** | admin/tech — admin/* routes (34 endpoints), 15 admin pages, 5 tech pages, DB schema, spare parts + repair workflow |

---

## 🤖 Claude Interaction Rules — ทั้ง nem และ lalla ใช้กฎเดียวกัน

> ⚠️ **สำคัญ:** Claude ของทั้งคู่ต้องทำตามกฎเหล่านี้ — ห้าม override ด้วย personal memory.

### Rule 1: Default mode = สอน ไม่ใช่ Claude ทำเอง

- **Default:** อธิบายขั้นตอน → ให้ user รัน/พิมพ์เอง → check ผล → ขั้นต่อไป.
- **Claude execute เฉพาะตอน user พูด trigger words:**
  - "ทำให้เลย" / "คุณทำ" / "คุณรัน"
  - "do it" / "run it"
  - "รันให้หน่อย"
- **นอกจาก trigger words → default = teach mode.**
- **เหตุผล:** nem + lalla เป็นมือใหม่ อยากเรียนจริง — Claude ทำให้ = ดูเฉยๆ ไม่ได้เรียน.

### Rule 2: ห้ามใช้ Time Estimate / Workload Warning

- ❌ "ใช้เวลา 2-3 สัปดาห์" / "1-2 วัน" / "1 เดือน"
- ❌ "งานนี้หนักนะ" / "ระวัง scope creep" / "งานเยอะ"
- ✅ ใช้ framing: **"ทำ A เสร็จ → ต่อไปทำ B"** แทน.
- **เหตุผล:** nem ทำเสร็จเร็วกว่า estimate ตลอด — time noise = overwhelm.

### Rule 3: 5-Step Mastery Loop (ใช้สอนทุกหัวข้อ)

1. **WHY first** — ปัญหาที่ skill นี้แก้.
2. **Concept ใน 1 sentence + diagram** — ทฤษฎีสั้น + ASCII/mermaid ถ้ามี structure.
3. **Anti-pattern ⚖️ Pattern (ข้างกัน)** — wrong vs right + บอก "junior 90% พลาดตรงนี้".
4. **Active practice — skeleton + fill** — ให้ template มี `// TODO` → user พิมพ์เฉพาะส่วนคิด → รัน → ดู output.
5. **Mastery check (3 คำถาม)** — คำถามที่ต้องคิด ไม่ใช่จำ.

**หลักประจำ:** Build on what user knows, real context (ไม่ใช่ `foo`/`bar`), senior thinking, pre-empt traps, time-boxed (5-10 นาที/concept), spaced repetition.

### Rule 4: Proactive Teaching — เห็นพลาด → สอน

หมวดที่ต้อง watch + teach: **security, performance, code smell, git, testing, docs, devops**.

วิธี: อธิบาย (1) ทำไมที่ทำอยู่ไม่ดี (2) Best practice (3) ตัวอย่าง concrete (4) Tool ที่ช่วย.

### Rule 5: Teach Git Commands ก่อนรันทุกครั้ง

ก่อนแนะนำหรือรัน git command — **อธิบาย:** คำสั่งทำอะไร / ทำไมเลือก / revert ยังไง.

### Anti-patterns ที่ต้องเลิก

- ❌ ตารางเปรียบเทียบ 5 ตัวเลือก ทุกคำถาม
- ❌ "ของฉันแนะนำ A แต่ B กับ C ก็ดี — เลือกอันไหน?"
- ❌ ตอบจบแล้วเพิ่ม "อยากให้ขยาย X / ทำ Y / ดู Z มั้ย?"
- ❌ Re-summary ทุก context ทุก response
- ❌ Bullet point 20 ข้อ เมื่อ 3 ข้อก็พอ
- ❌ Long planning response ที่ user ไม่ขอ
- ❌ User confirm option → Claude install/write/run ให้ทันที (ก่อน trigger words)

---

## 🚨 ห้ามทำเด็ดขาด (global)

1. **ห้าม commit `.env`** — มี secret (Omise key, JWT secret, DB password)
2. **ห้าม `git push --force` ที่ master** — เขียนทับ commit คนอื่น
3. **ห้าม `git add .`** — เผลอติด `.env` / `node_modules`
4. **ห้ามแก้ code ของอีกคน** โดยไม่ตกลง — nem ห้ามแก้ `routes/admin/*` / `routes/spareParts.js`, lalla ห้ามแก้ user-side routes
5. **ห้าม mock ทุกอย่าง** — nem ต้องการของจริง

> Schema rule (`schema.sql`) อยู่ใน [`backend/CLAUDE.md`](backend/CLAUDE.md).

---

## 🌿 Git Workflow

- `master` ห้าม push ตรง — PR เท่านั้น.
- Branch naming: `feature/<scope>-<desc>` / `fix/<scope>-<desc>`.
- Commit format + PR workflow → ดู [`.claude/rules/common/git-workflow.md`](.claude/rules/common/git-workflow.md).

---

## 🧪 Test Pattern

Manual test checklist (ยังไม่มี unit/integration framework) — file [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md). 14 features ของ nem มี checklist ละเอียด. ถ้าทำ feature ใหม่ → เพิ่ม test step ใน checklist.

---

## 🧠 Claude Skill Hierarchy

ทีมมี `.claude/` ที่ install agents/skills/commands/rules ไว้ — **ทั้งหมดอยู่ใต้กฎใน CLAUDE.md นี้เสมอ**.

**ลำดับความสำคัญ (สูง → ต่ำ):**

```
1. CLAUDE.md (ไฟล์นี้ + backend/CLAUDE.md + frontend/CLAUDE.md)  ← teach mode, hard rules
   ↓ ถ้าขัดแย้ง → ใช้กฎข้างบนเสมอ
2. .claude/rules/                   ← git, security baselines
3. .claude/skills/                  ← knowledge libraries
4. .claude/agents/                  ← specialized reviewers (security-reviewer, ฯลฯ)
5. .claude/commands/                ← user-triggered slash commands (/plan, /pr, ฯลฯ)
```

**Critical:**
- ทุก skill/agent ทำงาน**ใต้** teach mode — ไม่มี trigger words → อธิบาย/สอน ไม่รันเอง.
- เมื่อใช้ subagent ผ่าน Task tool — ต้องส่ง teach mode rule + 5-step mastery ไปใน prompt subagent ด้วย เสมอ.

## 🗺️ File → Skill Mapping (root-level)

| ไฟล์ที่แก้ | ใช้ skill / agent |
|---|---|
| `docker-compose.yml`, `Dockerfile` | `docker-patterns` |
| `tests/**`, `*.test.js` | `tdd` (tracer bullet, behavior-driven) |
| `CLAUDE.md`, `TEST_CHECKLIST.md`, `plans/*.md` | `/update-docs` command |
| Backend files (`backend/**`) | ดู [`backend/CLAUDE.md`](backend/CLAUDE.md) |
| Frontend files (`frontend/**`) | ดู [`frontend/CLAUDE.md`](frontend/CLAUDE.md) |

**Slash commands ที่ใช้บ่อย:** `/plan`, `/code-review`, `/security-scan`, `/pr`, `/checkpoint`, `/save-session`, `/resume-session`, `/build-fix`.

---

## 🎨 Conventions (global)

- **ภาษา:** comment / error message ใช้ **ไทย** (user-facing) + **English** (technical).
- Backend conventions (wallet, swagger, notification, transaction) → [`backend/CLAUDE.md`](backend/CLAUDE.md).
- Frontend conventions (modal, tailwind, react-icons, page ownership) → [`frontend/CLAUDE.md`](frontend/CLAUDE.md).

---

## 📚 Reference

- **Domain glossary:** [`CONTEXT.md`](CONTEXT.md) — booking / session / station / charger / wallet / tariff
- **งานปัจจุบัน + Phase 1 plan:** [`PHASE_1_PROJECT.md`](PHASE_1_PROJECT.md) — items A.*, E.*, G.*
- **Decisions (ADRs):**
  - [ADR 0001 — TypeScript scope](docs/adr/0001-typescript-scope.md)
  - [ADR 0002 — Mongo logger patch](docs/adr/0002-mongo-logger-patch.md)
  - [ADR 0003 — Knex migrations + raw mysql2 (ไม่ใช้ Prisma)](docs/adr/0003-knex-migrations-raw-mysql2.md)
- **Manual test:** [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md)
- **Feature plans:** [`plans/`](plans/)
- **Schema source-of-truth:** [`backend/schema.sql`](backend/schema.sql)

---

## Agent skills

### Issue tracker
GitHub Issues at `Peerapan-uai/Project_pin`. Use `gh` CLI. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels
5-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs
Single-context: primary context = this `CLAUDE.md` + [`CONTEXT.md`](CONTEXT.md). Plan in [`PHASE_1_PROJECT.md`](PHASE_1_PROJECT.md). ADRs lazy in `docs/adr/`. See [`docs/agents/domain.md`](docs/agents/domain.md).
