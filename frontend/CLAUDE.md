# Frontend — Claude rules

> Auto-loads when working on files under `frontend/`. Inherits all rules from root [`CLAUDE.md`](../CLAUDE.md).

---

## 👥 Page ownership

| Path | Owner |
|---|---|
| `src/pages/user/` (20 หน้า) | nem |
| `src/pages/admin/` (15 หน้า) | lalla |
| `src/pages/tech/` (5 หน้า) | lalla |
| `src/pages/shared/` (Login, Register) | ทั้งคู่ |

---

## 🎨 Conventions (frontend)

- **Stack:** React (Vite) + Tailwind + react-icons (`FaXxx`)
- **Modal style — Bottom sheet:**
  ```jsx
  <div className="absolute inset-0 bg-black/50 z-[60] flex items-end">
    <div className="bg-white w-full rounded-t-3xl">
      {/* content */}
    </div>
  </div>
  ```
- **Error message:** ใช้ **ไทย** (user-facing)
- **Comment:** ใช้ **English** (technical)

---

## 🗺️ File → Skill Mapping (frontend)

ยังไม่มี `frontend-patterns` skill installed — เพิ่ม mapping เมื่อ install
