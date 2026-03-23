# EV Charger App - Project Documentation
# ใช้ไฟล์นี้เป็น context ให้ AI (Claude Code) เข้าใจโปรเจคทั้งหมด

---

## 📋 Project Overview
แอป EV Charging Station Booking — เว็บแอปจองตู้ชาร์จรถไฟฟ้า
- โปรเจคมหาวิทยาลัย (ส่งพรีเซน)
- ใช้ข้อมูลอ้างอิงจากแอป EA Anywhere (เจ้าใหญ่สุดในไทย)
- ทีม 2 คน
- **Deadline: พุธที่ 25 มี.ค. 2026 เวลา 15:00 (พรีเซน)**

---

## 📁 Folder Structure
```
ev-charger/
├── docker-compose.yml
├── PROJECT.md
├── backend/
│   ├── package.json
│   ├── .env
│   ├── server.js
│   ├── config/
│   │   ├── db.js          (MySQL connection)
│   │   └── mongodb.js     (MongoDB connection)
│   ├── middleware/
│   │   ├── auth.js         (JWT verify)
│   │   ├── roleCheck.js    (role permission)
│   │   └── logger.js       (morgan + MongoDB log)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── vehicles.js
│   │   ├── stations.js
│   │   ├── chargers.js
│   │   ├── bookings.js
│   │   ├── sessions.js
│   │   ├── payments.js
│   │   ├── reviews.js
│   │   ├── tickets.js
│   │   └── notifications.js
│   └── models/
│       └── Log.js          (Mongoose schema for MongoDB logs)
├── frontend/
│   ├── package.json
│   ├── .env
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── data/           (mock data)
│       │   ├── users.js
│       │   ├── vehicles.js
│       │   ├── stations.js
│       │   ├── chargers.js
│       │   ├── bookings.js
│       │   ├── tickets.js
│       │   └── notifications.js
│       ├── components/     (reusable components)
│       │   ├── Navbar.jsx
│       │   ├── BottomNav.jsx
│       │   ├── Sidebar.jsx
│       │   ├── NotificationBell.jsx
│       │   └── StatusBadge.jsx
│       ├── layouts/
│       │   ├── MobileLayout.jsx    (max-width 430px wrapper)
│       │   ├── DesktopLayout.jsx   (sidebar + main)
│       │   └── ResponsiveLayout.jsx (tech)
│       ├── pages/
│       │   ├── shared/
│       │   │   ├── LoginPage.jsx
│       │   │   └── RegisterPage.jsx
│       │   ├── user/
│       │   │   ├── HomePage.jsx
│       │   │   ├── StationDetailPage.jsx
│       │   │   ├── ChargerDetailPage.jsx
│       │   │   ├── BookingPage.jsx
│       │   │   ├── ChargingPage.jsx
│       │   │   ├── PaymentPage.jsx
│       │   │   ├── BookingHistoryPage.jsx
│       │   │   ├── PaymentHistoryPage.jsx
│       │   │   ├── ReviewPage.jsx
│       │   │   ├── ReportIssuePage.jsx
│       │   │   ├── ProfilePage.jsx
│       │   │   ├── VehicleManagePage.jsx
│       │   │   └── NotificationsPage.jsx
│       │   ├── admin/
│       │   │   ├── DashboardPage.jsx
│       │   │   ├── StationManagePage.jsx
│       │   │   ├── ChargerManagePage.jsx
│       │   │   ├── UserManagePage.jsx
│       │   │   ├── TechnicianManagePage.jsx
│       │   │   ├── BookingManagePage.jsx
│       │   │   ├── TicketManagePage.jsx
│       │   │   └── AdminNotificationsPage.jsx
│       │   └── technician/
│       │       ├── TechDashboardPage.jsx
│       │       ├── TicketDetailPage.jsx
│       │       ├── UpdateTicketPage.jsx
│       │       ├── TechHistoryPage.jsx
│       │       └── TechNotificationsPage.jsx
│       └── routes/
│           └── AppRouter.jsx
```

---

## 🐳 Docker Compose
```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: ev_charger_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ev_charger
      MYSQL_USER: admin
      MYSQL_PASSWORD: admin
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: ev_charger_phpmyadmin
    restart: always
    depends_on:
      - mysql
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
    ports:
      - "8081:80"

  mongodb:
    image: mongo:7
    container_name: ev_charger_mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  mongo-express:
    image: mongo-express:latest
    container_name: ev_charger_mongo_express
    restart: always
    depends_on:
      - mongodb
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: admin
      ME_CONFIG_MONGODB_URL: mongodb://admin:admin@mongodb:27017/
      ME_CONFIG_BASICAUTH: "false"
    ports:
      - "8082:8081"

volumes:
  mysql_data:
  mongo_data:
```

---

## 🛠 Tech Stack
### Language: JavaScript (ไม่ใช่ TypeScript)
### Node.js Version: 20.20.0 LTS (Iron)

### Front-end
- React + Vite (JavaScript, ไม่ใช่ TypeScript)
- Tailwind CSS (styling)
- react-router-dom (routing)
- axios (API calls — ยังไม่เชื่อม back-end, ใช้ mock data ก่อน)
- @react-google-maps/api (Google Maps — ใช้ API จริง ต้องมี API key)
- qrcode.react (generate QR Code)
- react-icons (icons)

### Back-end (แยกทำภายหลัง)
- Node.js v20.20.0 LTS + Express (JavaScript, ไม่ใช่ TypeScript)
- mysql2 (MySQL)
- mongoose (MongoDB)
- jsonwebtoken + bcryptjs (JWT auth)
- cors, dotenv, multer, morgan
- swagger-jsdoc + swagger-ui-express (API docs)

### Database
- MySQL (ข้อมูลหลัก: users, stations, bookings, payments)
- MongoDB (logs: api_logs, activity_logs)
- phpMyAdmin (จัดการ MySQL ผ่านเว็บ)
- Mongo Express (จัดการ MongoDB ผ่านเว็บ)
- ทั้งหมดรันผ่าน Docker

---

## 👥 Roles (3 roles)

### 1. User (ผู้ใช้ทั่วไป)
- สมัครสมาชิก / เข้าสู่ระบบ
- เพิ่ม/จัดการรถ EV ของตัวเอง (ยี่ห้อ, รุ่น, ทะเบียน, หัวชาร์จ)
- ค้นหาสถานีชาร์จ (แผนที่ + filter ตาม type หัวชาร์จ, ระยะทาง)
- ดูรายละเอียดสถานี (ตู้ทั้งหมด + สถานะแต่ละตู้ + จำนวนคิว)
- จองตู้ชาร์จ (ล็อค 30 นาที)
- เริ่มชาร์จ (scan QR) + ดู % real-time
- จ่ายเงิน (mock)
- ดูประวัติการชาร์จ + การจ่ายเงิน
- เขียนรีวิวสถานี (ดาว + comment)
- แจ้งปัญหาตู้ชาร์จ (+ อัปโหลดรูป)
- รับแจ้งเตือน in-app (กระดิ่ง)

### 2. Admin (ผู้ดูแลระบบ)
- เข้าสู่ระบบ
- ดู Dashboard (สถิติรวม: จำนวน user, booking วันนี้, รายได้, ตู้มีปัญหา)
- จัดการสถานี CRUD (เพิ่ม/แก้/ลบ)
- จัดการตู้ชาร์จ CRUD (เพิ่ม/แก้/ลบ/เปลี่ยนสถานะ)
- จัดการ user (ดู list, แบน/ปลดแบน)
- สร้าง account ช่าง (เพิ่ม role technician)
- ดู booking ทั้งหมด (filter ตามวัน/สถานี)
- รับแจ้งปัญหาจาก user → เปลี่ยนสถานะตู้เป็น "ปิดซ่อม" → มอบหมายงานให้ช่าง
- รับแจ้งเตือน in-app

### 3. Technician (ช่างซ่อม)
- เข้าสู่ระบบ
- ดูรายการงานซ่อมที่ได้รับมอบหมาย
- รับงาน → อัปเดตสถานะ (รับงาน → กำลังซ่อม → เสร็จ)
- อัปโหลดรูปถ่ายหลังซ่อมเสร็จ
- เปลี่ยนสถานะตู้กลับเป็น "พร้อมใช้งาน" เมื่อซ่อมเสร็จ
- ดูประวัติงานซ่อม
- รับแจ้งเตือน in-app

---

## 📱 Layout Strategy

### User → Mobile View Only
- max-width: 430px, อยู่กลางจอ
- ดูเหมือนแอปมือถือแต่รันบน browser
- Bottom navigation bar (Home, Search, Bookings, Profile)

### Admin → Desktop View Only
- Full width, sidebar navigation
- Dashboard layout with cards/charts

### Technician → Mobile + Desktop (Responsive)
- Mobile-first แล้ว responsive ขึ้น desktop
- ช่างใช้มือถือตอนออกซ่อมหน้างาน แต่ใช้ desktop ได้ด้วย

---

## 📄 Pages ทั้งหมด + รายละเอียด UI แต่ละหน้า

### Shared Pages (ใช้ร่วมกันทุก role)

**1. LoginPage**
- Logo แอป + ชื่อแอป ด้านบน
- Input: email, password (มี icon ตา toggle ดู password)
- ปุ่ม "เข้าสู่ระบบ" (สีเขียว primary)
- ลิงก์ "ยังไม่มีบัญชี? สมัครสมาชิก"
- ระบบเช็ค role → redirect (user → HomePage, admin → DashboardPage, tech → TechDashboardPage)

**2. RegisterPage**
- Input: email, password, ยืนยัน password, ชื่อ, นามสกุล, เบอร์โทร
- ปุ่ม "สมัครสมาชิก"
- ลิงก์ "มีบัญชีแล้ว? เข้าสู่ระบบ"
- Validation: email ถูก format, password ขั้นต่ำ 6 ตัว, password ตรงกัน

---

### User Pages (Mobile View — max-width: 430px)

**1. HomePage**
- Header: โลโก้ซ้าย + กระดิ่ง notification ขวา (มี badge จำนวนที่ยังไม่อ่าน)
- Search bar: พิมพ์ค้นหาสถานี
- Filter chips: แถวนอน scroll ได้ (All, CCS, CHAdeMO, Type2, Type1)
- Google Maps: แสดง pin สถานีทั้งหมด, กดที่ pin → popup ชื่อสถานี + rating + ระยะทาง + จำนวนตู้ว่าง
- ด้านล่างแผนที่: list สถานีใกล้เคียง (card แต่ละอัน: ชื่อ, ที่อยู่, ระยะทาง, rating ดาว, จำนวนตู้ว่าง/ทั้งหมด)
- กดที่ card → ไป StationDetailPage
- Bottom Nav: 🏠 หน้าหลัก | 🔍 ค้นหา | 📋 การจอง | 👤 โปรไฟล์

**2. StationDetailPage**
- Header: ปุ่มย้อนกลับ + ชื่อสถานี
- รูปสถานี (ถ้ามี)
- ข้อมูลสถานี: ชื่อ, ที่อยู่, ชั้น, เวลาเปิด-ปิด
- Rating: ดาวเฉลี่ย + จำนวนรีวิว (กดได้ → ไปดูรีวิว)
- ปุ่ม "นำทาง" (เปิด Google Maps directions)
- Section "ตู้ชาร์จทั้งหมด": list ตู้แต่ละตัว แสดง
  - ชื่อตู้ (ตู้ A1)
  - type หัวชาร์จ (CCS)
  - กำลังไฟ (50 kW)
  - ราคา (6.50 บาท/kWh)
  - สถานะ badge สี (🟢ว่าง / 🟡จอง / 🔵ชาร์จอยู่ XX% / 🔴ปิดซ่อม)
  - จำนวนคิว (ถ้ามี): "รอคิว 2 คน"
  - กดที่ตู้ → ไป ChargerDetailPage
- ปุ่ม "แจ้งปัญหา" (มุมล่าง)

**3. ChargerDetailPage**
- Header: ปุ่มย้อนกลับ + ชื่อตู้
- ข้อมูลตู้: ชื่อตู้, สถานี, ชั้น, type หัวชาร์จ, กำลังไฟ kW, ราคา/kWh
- สถานะ badge ใหญ่ (พร้อมสี)
- QR Code ของตู้ (generate จาก qrcode.react)
- ถ้าสถานะ available: ปุ่ม "จองตู้นี้" (สีเขียวใหญ่)
- ถ้าสถานะ reserved/charging: แสดงข้อมูล "ว่างประมาณ XX:XX" + ปุ่ม "เข้าคิว"
- ถ้าสถานะ out_of_service: แสดง "ตู้นี้ปิดซ่อม"

**4. BookingPage**
- Header: ปุ่มย้อนกลับ + "ยืนยันการจอง"
- สรุปข้อมูล: ชื่อสถานี, ชื่อตู้, type หัวชาร์จ, กำลังไฟ
- เวลาจอง: แสดงเวลาเริ่ม-สิ้นสุด (ล็อค 30 นาที)
- ราคาประมาณการ: คำนวณจาก kW × เวลา × ราคา/kWh
- รถที่ใช้: dropdown เลือกรถจาก list รถของ user
- ปุ่ม "ยืนยันจอง" (สีเขียวใหญ่)
- ปุ่ม "ยกเลิก" (สีเทา)

**5. ChargingPage**
- Header: "กำลังชาร์จ..."
- วงกลมใหญ่ตรงกลาง: แสดง % แบตเตอรี่ (animated, เลขใหญ่)
- ข้อมูลด้านล่างวงกลม (3 cards):
  - ⚡ พลังงาน: XX.XX kWh
  - ⏱ เวลา: XX นาที
  - 💰 ค่าใช้จ่าย: XX.XX บาท
- Progress bar แสดงความคืบหน้า
- ชื่อสถานี + ชื่อตู้
- ปุ่ม "หยุดชาร์จ" (สีแดง ด้านล่าง)
- Note: ใช้ mock data จำลอง % ค่อยๆ เพิ่มขึ้น (setInterval)

**6. PaymentPage**
- Header: ปุ่มย้อนกลับ + "ชำระเงิน"
- สรุปการชาร์จ: สถานี, ตู้, เวลาเริ่ม-จบ, พลังงาน kWh
- ยอดรวม: XX.XX บาท (ตัวเลขใหญ่ เด่น)
- เลือกวิธีจ่าย: radio buttons (บัตรเครดิต, PromptPay, Wallet) — ทั้งหมด mock
- ปุ่ม "จ่ายเงิน" (สีเขียวใหญ่)
- หลังกดจ่าย: แสดง animation ✅ สำเร็จ + เลข transaction ref

**7. BookingHistoryPage**
- Header: "ประวัติการจอง"
- Tab: ทั้งหมด | กำลังดำเนินการ | เสร็จสิ้น | ยกเลิก
- List cards: แต่ละ booking แสดง
  - ชื่อสถานี + ชื่อตู้
  - วันที่ + เวลา
  - สถานะ badge (confirmed/completed/cancelled/expired)
  - พลังงาน kWh + ค่าใช้จ่าย (ถ้าเสร็จแล้ว)
- กด card → ดูรายละเอียดเพิ่ม

**8. PaymentHistoryPage**
- Header: "ประวัติการชำระเงิน"
- List cards: แต่ละ payment แสดง
  - วันที่ + เวลา
  - ชื่อสถานี
  - จำนวนเงิน
  - วิธีจ่าย
  - สถานะ (completed/failed/refunded)
  - เลข transaction ref

**9. ReviewPage**
- Header: ปุ่มย้อนกลับ + "เขียนรีวิว"
- ชื่อสถานี
- เลือกดาว 1-5 (กดดาวได้ ดาวเปลี่ยนสีเป็นเหลือง)
- Textarea: เขียน comment
- ปุ่ม "ส่งรีวิว"
- ด้านล่าง: แสดงรีวิวจากคนอื่น (รูป profile, ชื่อ, ดาว, comment, วันที่)

**10. ReportIssuePage**
- Header: ปุ่มย้อนกลับ + "แจ้งปัญหา"
- เลือกสถานี (dropdown)
- เลือกตู้ที่มีปัญหา (dropdown)
- Input: หัวข้อปัญหา
- Textarea: รายละเอียด
- อัปโหลดรูป (กดเลือกไฟล์ แสดง preview)
- เลือก priority (ต่ำ/กลาง/สูง/วิกฤต)
- ปุ่ม "ส่งรายงาน"

**11. ProfilePage**
- Header: "โปรไฟล์"
- รูป profile (กดเปลี่ยนได้)
- ข้อมูล: ชื่อ, นามสกุล, email, เบอร์
- ปุ่ม "แก้ไขโปรไฟล์" → เปิด modal/หน้าแก้ไข
- Section "รถของฉัน": list รถ + ปุ่ม "จัดการรถ" → ไป VehicleManagePage
- ปุ่ม "ออกจากระบบ" (สีแดง)

**12. VehicleManagePage**
- Header: ปุ่มย้อนกลับ + "จัดการรถ"
- List รถ: card แต่ละคัน (ยี่ห้อ, รุ่น, ทะเบียน, type หัวชาร์จ, ความจุแบต)
- แต่ละ card มีปุ่ม แก้ไข + ลบ
- ปุ่ม "+ เพิ่มรถ" (FAB หรือปุ่มด้านบน)
- Modal เพิ่ม/แก้ไข: input ยี่ห้อ, รุ่น, ทะเบียน, dropdown หัวชาร์จ, ความจุแบต kWh

**13. NotificationsPage**
- Header: "แจ้งเตือน" + ปุ่ม "อ่านทั้งหมด"
- List notifications: แต่ละอัน
  - Icon ตาม type (🔔 booking, ⚡ charging, 💰 payment, 🔧 maintenance)
  - หัวข้อ (bold ถ้ายังไม่อ่าน)
  - ข้อความ
  - เวลา (เช่น "5 นาทีที่แล้ว", "เมื่อวาน")
  - พื้นหลังสีต่างกัน (ยังไม่อ่าน = สีเขียวอ่อน, อ่านแล้ว = ขาว)
- กดที่ notification → mark as read

---

### Admin Pages (Desktop View — Full Width + Sidebar)

**1. DashboardPage**
- 4 stat cards ด้านบน:
  - 👥 จำนวน user ทั้งหมด
  - 📋 booking วันนี้
  - 💰 รายได้วันนี้ (บาท)
  - 🔴 ตู้ที่มีปัญหา
- Chart: กราฟรายได้ 7 วันล่าสุด (bar chart หรือ line chart)
- Table: booking ล่าสุด 10 รายการ
- Table: ticket แจ้งซ่อมล่าสุดที่ยังไม่เสร็จ

**2. StationManagePage**
- ปุ่ม "+ เพิ่มสถานี"
- Table: สถานีทั้งหมด (columns: ID, ชื่อ, ที่อยู่, ชั้น, สถานะ, จำนวนตู้, actions)
- Actions: ปุ่ม แก้ไข + ลบ
- Modal เพิ่ม/แก้ไข: input ชื่อ, ที่อยู่, ชั้น, พิกัด lat/lng, เวลาเปิด-ปิด, อัปโหลดรูป

**3. ChargerManagePage**
- Dropdown เลือกสถานี (filter)
- ปุ่ม "+ เพิ่มตู้ชาร์จ"
- Table: ตู้ทั้งหมด (columns: ID, ชื่อตู้, สถานี, type หัวชาร์จ, kW, ราคา/kWh, สถานะ, actions)
- Actions: แก้ไข + ลบ + dropdown เปลี่ยนสถานะ (available/out_of_service)
- Modal เพิ่ม/แก้ไข: เลือกสถานี, ชื่อตู้, type, kW, ราคา

**4. UserManagePage**
- Search bar: ค้นหาด้วยชื่อ/email
- Filter: role (all/user/technician)
- Table: user ทั้งหมด (columns: ID, ชื่อ, email, เบอร์, role, สถานะ, วันที่สมัคร, actions)
- Actions: ปุ่มแบน/ปลดแบน (toggle) + modal ใส่เหตุผลการแบน
- Badge: ปกติ = เขียว, ถูกแบน = แดง

**5. TechnicianManagePage**
- ปุ่ม "+ เพิ่มช่าง"
- Table: ช่างทั้งหมด (columns: ID, ชื่อ, email, เบอร์, งานที่รับผิดชอบ, สถานะ)
- Modal สร้างช่าง: input email, password, ชื่อ, นามสกุล, เบอร์

**6. BookingManagePage**
- Filter: เลือกวัน (date picker) + เลือกสถานี (dropdown)
- Table: booking ทั้งหมด (columns: ID, user, สถานี, ตู้, วันเวลา, สถานะ, ยอดเงิน)
- กด row → ดูรายละเอียด

**7. TicketManagePage**
- Filter: สถานะ (all/reported/assigned/in_progress/completed)
- Table: ticket ทั้งหมด (columns: ID, ตู้, สถานี, ผู้แจ้ง, ช่าง, สถานะ, priority, วันที่)
- Actions:
  - ถ้าสถานะ reported → dropdown เลือกช่าง + ปุ่ม "มอบหมาย"
  - กดดูรายละเอียด → modal แสดงรูปจาก user + รายละเอียด
- Priority badge สี (low=เทา, medium=เหลือง, high=ส้ม, critical=แดง)

**8. AdminNotificationsPage**
- เหมือน NotificationsPage ของ user แต่ full width

---

### Technician Pages (Responsive — Mobile + Desktop)

**1. TechDashboardPage**
- 3 stat cards ด้านบน:
  - 🆕 งานใหม่ (จำนวน)
  - 🔧 กำลังซ่อม (จำนวน)
  - ✅ เสร็จแล้ว (จำนวน)
- List งานซ่อม: cards เรียงตาม priority
  - แต่ละ card: ชื่อตู้, สถานี, ปัญหา, priority badge, สถานะ, วันที่
  - กด card → ไป TicketDetailPage

**2. TicketDetailPage**
- Header: ปุ่มย้อนกลับ + "รายละเอียดงาน"
- ข้อมูลตู้: ชื่อตู้, สถานี, ชั้น, ที่อยู่
- ข้อมูลปัญหา: หัวข้อ, รายละเอียด, priority badge
- ผู้แจ้ง: ชื่อ + วันเวลาที่แจ้ง
- รูปจาก user (ถ้ามี) — กดขยายดูได้
- สถานะปัจจุบัน (progress steps: แจ้ง → มอบหมาย → กำลังซ่อม → เสร็จ)
- ปุ่ม "รับงาน" (ถ้าสถานะ assigned) / "อัปเดตสถานะ" (ถ้า in_progress)

**3. UpdateTicketPage**
- Header: ปุ่มย้อนกลับ + "อัปเดตงาน"
- เลือกสถานะใหม่: radio (กำลังซ่อม / ซ่อมเสร็จ)
- Textarea: บันทึกการซ่อม (ทำอะไรไปบ้าง)
- อัปโหลดรูปหลังซ่อม (กดเลือกไฟล์ + preview)
- ปุ่ม "บันทึก"
- ถ้าเลือก "ซ่อมเสร็จ" → สถานะตู้เปลี่ยนกลับเป็น available อัตโนมัติ

**4. TechHistoryPage**
- Header: "ประวัติงานซ่อม"
- Filter: สถานะ (all/completed)
- List cards: งานที่เสร็จแล้ว (ชื่อตู้, สถานี, ปัญหา, วันที่เสร็จ)

**5. TechNotificationsPage**
- เหมือน NotificationsPage ของ user แต่ responsive

---

## 🎨 Design Guidelines

### Color Palette
- Primary: #22C55E (green-500) — สีหลัก (EV = พลังงานสะอาด = เขียว)
- Secondary: #3B82F6 (blue-500) — ปุ่มรอง
- Danger: #EF4444 (red-500) — ลบ, แบน, ปัญหา
- Warning: #F59E0B (amber-500) — รอดำเนินการ
- Background: #F9FAFB (gray-50) — พื้นหลัง
- Card: #FFFFFF — การ์ด
- Text: #111827 (gray-900) — ข้อความหลัก
- Text Secondary: #6B7280 (gray-500) — ข้อความรอง

### Charger Status Colors
- 🟢 available (ว่าง): #22C55E green
- 🟡 reserved (ถูกจอง): #F59E0B amber
- 🔵 charging (กำลังชาร์จ): #3B82F6 blue
- 🔴 out_of_service (ปิดซ่อม): #EF4444 red

### Typography
- Font: Inter หรือ Sarabun (รองรับภาษาไทย)
- ใช้ภาษาไทยเป็นหลักใน UI

### Mobile Layout (User + Technician Mobile)
- max-width: 430px
- centered on screen
- มี background สีเทาอ่อนรอบๆ ให้ดูเหมือนมือถืออยู่กลางจอ
- Bottom Navigation (fixed bottom)
- Header with back button + title + notification bell

### Desktop Layout (Admin)
- Sidebar ซ้าย (fixed, width: 250px)
- Main content area ขวา
- Top bar with admin name + notification bell

---

## 🔀 Key User Flows

### Flow 1: User จองและชาร์จ
Login → เห็นแผนที่ → เลือกสถานี → เห็นตู้ + สถานะ → เลือกตู้ว่าง → จอง 30 นาที → เดินทางไปสถานี → scan QR → เริ่มชาร์จ → ดู % real-time → ชาร์จเสร็จ → จ่ายเงิน → รีวิว

### Flow 2: User แจ้งปัญหา → Admin → ช่าง
User เจอตู้เสีย → กดแจ้งปัญหา + ถ่ายรูป → Admin เห็น ticket → เปลี่ยนสถานะตู้เป็น out_of_service → มอบหมายช่าง → ช่างรับงาน → ไปซ่อม → อัปเดตสถานะ + ถ่ายรูปหลังซ่อม → สถานะตู้กลับเป็น available

### Flow 3: สถานะตู้ real-time
User1 จองตู้ A1 → ตู้ A1 เปลี่ยนเป็น reserved → User2 เปิดดูสถานีเดียวกัน → เห็นตู้ A1 เป็น "ถูกจองแล้ว" → เลือกตู้อื่นหรือเข้าคิว

---

## 📊 Charger Statuses
- `available` — ว่าง จองได้ (🟢)
- `reserved` — ถูกจองแล้ว รอคนมาชาร์จ (🟡)
- `charging` — กำลังชาร์จอยู่ (🔵)
- `out_of_service` — ปิดซ่อม (🔴)

---

## 🗄 Database Schema (MySQL)

### users
| Column | Type | Note |
|--------|------|------|
| user_id | INT PK AUTO_INCREMENT | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| phone | VARCHAR(20) | |
| profile_image | VARCHAR(500) | |
| role | ENUM('user','admin','technician') | |
| is_banned | BOOLEAN DEFAULT FALSE | |
| ban_reason | VARCHAR(500) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### vehicles
| Column | Type | Note |
|--------|------|------|
| vehicle_id | INT PK | |
| user_id | INT FK → users | |
| brand | VARCHAR(100) | Tesla, BYD, MG |
| model | VARCHAR(100) | Model 3, Atto 3 |
| license_plate | VARCHAR(20) | |
| connector_type | ENUM('CCS','CHAdeMO','Type2','Type1') | |
| battery_capacity_kwh | DECIMAL(6,2) | |

### stations
| Column | Type | Note |
|--------|------|------|
| station_id | INT PK | |
| name | VARCHAR(255) | |
| address | VARCHAR(500) | |
| latitude | DECIMAL(10,8) | |
| longitude | DECIMAL(11,8) | |
| floor | VARCHAR(50) | ชั้น 2, ลานจอด B1 |
| open_time | TIME | |
| close_time | TIME | |
| image | VARCHAR(500) | |
| status | ENUM('active','inactive') | |

### chargers
| Column | Type | Note |
|--------|------|------|
| charger_id | INT PK | |
| station_id | INT FK → stations | |
| charger_name | VARCHAR(100) | ตู้ A1, ตู้ B2 |
| connector_type | ENUM('CCS','CHAdeMO','Type2','Type1') | |
| power_kw | DECIMAL(6,2) | 50.00, 150.00 |
| price_per_kwh | DECIMAL(6,2) | 6.50 บาท |
| status | ENUM('available','reserved','charging','out_of_service') | |
| qr_code | VARCHAR(500) | |

### bookings
| Column | Type | Note |
|--------|------|------|
| booking_id | INT PK | |
| user_id | INT FK → users | |
| charger_id | INT FK → chargers | |
| booking_time | TIMESTAMP | เวลาที่กดจอง |
| start_time | TIMESTAMP | เวลาเริ่มจอง |
| end_time | TIMESTAMP | start + 30 นาที |
| status | ENUM('pending','confirmed','cancelled','completed','expired') | |
| queue_position | INT NULL | ลำดับคิว |

### charging_sessions
| Column | Type | Note |
|--------|------|------|
| session_id | INT PK | |
| booking_id | INT FK → bookings | |
| user_id | INT FK → users | |
| charger_id | INT FK → chargers | |
| start_time | TIMESTAMP | |
| end_time | TIMESTAMP | |
| energy_kwh | DECIMAL(8,2) | kWh ที่ชาร์จ |
| charge_percentage | DECIMAL(5,2) | % ที่ชาร์จได้ |
| status | ENUM('charging','completed','failed','stopped') | |

### payments
| Column | Type | Note |
|--------|------|------|
| payment_id | INT PK | |
| session_id | INT FK → charging_sessions | |
| user_id | INT FK → users | |
| amount | DECIMAL(10,2) | บาท |
| method | ENUM('credit_card','promptpay','wallet') | |
| status | ENUM('pending','completed','failed','refunded') | |
| transaction_ref | VARCHAR(100) | |
| paid_at | TIMESTAMP | |

### reviews
| Column | Type | Note |
|--------|------|------|
| review_id | INT PK | |
| user_id | INT FK → users | |
| station_id | INT FK → stations | |
| rating | TINYINT (1-5) | |
| comment | TEXT | |

### maintenance_tickets
| Column | Type | Note |
|--------|------|------|
| ticket_id | INT PK | |
| charger_id | INT FK → chargers | |
| reported_by | INT FK → users | user ที่แจ้ง |
| assigned_to | INT FK → users NULL | ช่างที่รับงาน |
| title | VARCHAR(255) | |
| description | TEXT | |
| image | VARCHAR(500) | รูปจาก user |
| repair_image | VARCHAR(500) | รูปจากช่าง |
| status | ENUM('reported','assigned','in_progress','completed') | |
| priority | ENUM('low','medium','high','critical') | |
| completed_at | TIMESTAMP | |

### notifications
| Column | Type | Note |
|--------|------|------|
| notification_id | INT PK | |
| user_id | INT FK → users | |
| title | VARCHAR(255) | |
| message | TEXT | |
| type | ENUM('booking','charging','payment','maintenance','system') | |
| is_read | BOOLEAN DEFAULT FALSE | |

---

## 🔌 API Endpoints (38 total)

### Auth (3)
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

### Users (5)
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users — [Admin]
- PATCH /api/users/:id/ban — [Admin]
- POST /api/users/technician — [Admin]

### Vehicles (4)
- GET /api/vehicles
- POST /api/vehicles
- PUT /api/vehicles/:id
- DELETE /api/vehicles/:id

### Stations (5)
- GET /api/stations (+ filter)
- GET /api/stations/:id
- POST /api/stations — [Admin]
- PUT /api/stations/:id — [Admin]
- DELETE /api/stations/:id — [Admin]

### Chargers (5)
- GET /api/chargers/station/:stationId
- GET /api/chargers/:id
- POST /api/chargers — [Admin]
- PUT /api/chargers/:id — [Admin]
- PATCH /api/chargers/:id/status — [Admin/Tech]

### Bookings (5)
- POST /api/bookings
- GET /api/bookings
- GET /api/bookings/:id
- PATCH /api/bookings/:id/cancel
- GET /api/bookings/queue/:chargerId

### Charging Sessions (4)
- POST /api/sessions/start
- PATCH /api/sessions/:id/stop
- GET /api/sessions/:id/status
- GET /api/sessions/history

### Payments (3)
- POST /api/payments
- GET /api/payments/:id
- GET /api/payments/history

### Reviews (3)
- POST /api/reviews
- GET /api/reviews/station/:stationId
- DELETE /api/reviews/:id

### Maintenance Tickets (5)
- POST /api/tickets
- GET /api/tickets
- PATCH /api/tickets/:id/assign — [Admin]
- PATCH /api/tickets/:id/status — [Tech]
- POST /api/tickets/:id/image — [Tech]

### Notifications (3)
- GET /api/notifications
- PATCH /api/notifications/:id/read
- PATCH /api/notifications/read-all

---

## 📦 Mock Data (สำหรับ Front-end)

### Mock Users
```json
[
  { "user_id": 1, "email": "admin@evcharger.com", "first_name": "Admin", "last_name": "System", "role": "admin" },
  { "user_id": 2, "email": "tech1@evcharger.com", "first_name": "สมชาย", "last_name": "ช่างดี", "role": "technician" },
  { "user_id": 3, "email": "user1@gmail.com", "first_name": "สมหญิง", "last_name": "ใจดี", "role": "user", "is_banned": false },
  { "user_id": 4, "email": "user2@gmail.com", "first_name": "สมศักดิ์", "last_name": "รักษ์โลก", "role": "user", "is_banned": false }
]
```

### Mock Vehicles
```json
[
  { "vehicle_id": 1, "user_id": 3, "brand": "Tesla", "model": "Model 3", "license_plate": "กก 1234", "connector_type": "CCS", "battery_capacity_kwh": 60.00 },
  { "vehicle_id": 2, "user_id": 4, "brand": "BYD", "model": "Atto 3", "license_plate": "ขข 5678", "connector_type": "CCS", "battery_capacity_kwh": 49.92 }
]
```

### Mock Stations
```json
[
  { "station_id": 1, "name": "EV Hub สยามพารากอน", "address": "991 ถ.พระราม 1 แขวงปทุมวัน", "latitude": 13.7466, "longitude": 100.5347, "floor": "ชั้น B2", "status": "active", "rating": 4.5, "total_chargers": 3 },
  { "station_id": 2, "name": "EV Station เซ็นทรัลเวิลด์", "address": "999/9 ถ.พระราม 1 แขวงปทุมวัน", "latitude": 13.7468, "longitude": 100.5393, "floor": "ชั้น B1", "status": "active", "rating": 4.2, "total_chargers": 2 }
]
```

### Mock Chargers
```json
[
  { "charger_id": 1, "station_id": 1, "charger_name": "ตู้ A1", "connector_type": "CCS", "power_kw": 50.00, "price_per_kwh": 6.50, "status": "available", "queue_count": 0 },
  { "charger_id": 2, "station_id": 1, "charger_name": "ตู้ A2", "connector_type": "CCS", "power_kw": 150.00, "price_per_kwh": 7.50, "status": "charging", "queue_count": 0, "current_percentage": 65 },
  { "charger_id": 3, "station_id": 1, "charger_name": "ตู้ B1", "connector_type": "CHAdeMO", "power_kw": 50.00, "price_per_kwh": 6.50, "status": "out_of_service", "queue_count": 0 },
  { "charger_id": 4, "station_id": 2, "charger_name": "ตู้ C1", "connector_type": "CCS", "power_kw": 50.00, "price_per_kwh": 6.00, "status": "available", "queue_count": 0 },
  { "charger_id": 5, "station_id": 2, "charger_name": "ตู้ C2", "connector_type": "Type2", "power_kw": 22.00, "price_per_kwh": 5.00, "status": "reserved", "queue_count": 2 }
]
```

### Mock Maintenance Tickets
```json
[
  { "ticket_id": 1, "charger_id": 3, "charger_name": "ตู้ B1", "station_name": "EV Hub สยามพารากอน", "reported_by": 3, "reporter_name": "สมหญิง ใจดี", "assigned_to": 2, "tech_name": "สมชาย ช่างดี", "title": "หน้าจอไม่แสดงผล", "description": "กดแล้วหน้าจอดำ ไม่ขึ้นอะไรเลย", "status": "in_progress", "priority": "high", "created_at": "2025-03-23T10:00:00Z" },
  { "ticket_id": 2, "charger_id": 5, "charger_name": "ตู้ C2", "station_name": "EV Station เซ็นทรัลเวิลด์", "reported_by": 4, "reporter_name": "สมศักดิ์ รักษ์โลก", "assigned_to": null, "title": "สายชาร์จชำรุด", "description": "สายมีรอยแตก ไม่กล้าใช้", "status": "reported", "priority": "medium", "created_at": "2025-03-23T14:00:00Z" }
]
```

### Mock Notifications
```json
[
  { "notification_id": 1, "user_id": 3, "title": "จองสำเร็จ", "message": "คุณจองตู้ A1 ที่ EV Hub สยามพารากอน เวลา 14:00-14:30", "type": "booking", "is_read": false, "created_at": "2025-03-23T13:55:00Z" },
  { "notification_id": 2, "user_id": 3, "title": "ชาร์จเสร็จแล้ว!", "message": "ชาร์จครบ 80% ที่ตู้ A2 ค่าใช้จ่าย 195.00 บาท", "type": "charging", "is_read": true, "created_at": "2025-03-23T12:30:00Z" },
  { "notification_id": 3, "user_id": 2, "title": "งานซ่อมใหม่", "message": "ได้รับมอบหมายซ่อมตู้ B1 ที่ EV Hub สยามพารากอน", "type": "maintenance", "is_read": false, "created_at": "2025-03-23T10:05:00Z" }
]
```

---

## ⚠️ Important Notes
- Front-end ใช้ mock data ก่อน ยังไม่เชื่อม back-end
- สร้าง mock data ไว้ในโฟลเดอร์ src/data/ เป็นไฟล์ .js export ออกมา
- UI ใช้ภาษาไทยเป็นหลัก
- Payment เป็น mock (กดจ่าย → สำเร็จทันที) — อันนี้ mock จริงๆ ตามที่ตกลง
- Google Maps ใช้ API จริง (@react-google-maps/api) — ต้องใส่ API key ใน .env (VITE_GOOGLE_MAPS_API_KEY)
- QR Code ใช้ qrcode.react generate จริงได้เลย
