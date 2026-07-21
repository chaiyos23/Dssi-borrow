# DSSI Equipment Borrowing System (ระบบยืม-คืนอุปกรณ์วิทยบริการ คณะวิทยาศาสตร์)

ระบบยืม-คืนอุปกรณ์ คณะวิทยาศาสตร์ มหาวิทยาลัยอุบลราชธานี (UBU) สำหรับจัดการอุปกรณ์คอมพิวเตอร์และสื่อดิจิทัล เชื่อมโยง 3-Tier สถาปัตยกรรม (React + FastAPI + PostgreSQL)

---

## 🚀 วิธีการรันระบบ (How to Run)

### 1. 🌐 วิธีรันระบบหน้าบ้าน (Frontend - React)
เปิดหน้าต่าง Terminal หรือ Command Prompt ตัวที่ 1:
```bash
# 1. ย้ายเข้าไปที่โฟลเดอร์โครงการหลัก
cd c:\year3-2569\sofwaredev\project

# 2. รันหน้าเว็บ
npm run dev
```
* หน้าเว็บจะเข้าใช้งานได้ผ่านเบราว์เซอร์: **[http://localhost:5173](http://localhost:5173)**

---

### 2. 🐍 วิธีรันระบบหลังบ้าน (Backend - FastAPI)
เปิดหน้าต่าง Terminal หรือ Command Prompt ตัวที่ 2:
```bash
# 1. ย้ายเข้าไปที่โฟลเดอร์หลังบ้าน
cd c:\year3-2569\sofwaredev\project\backend

# 2. รันเซิร์ฟเวอร์หลังบ้าน
python -m uvicorn app.main:app --reload
```
* API Docs สำหรับทดสอบ API: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

---

## ⚙️ การตั้งค่าระบบ (Configuration)
การตั้งค่าเชื่อมต่อต่างๆ จะอยู่ในไฟล์ `backend/.env` (ไฟล์นี้เป็นข้อมูลความลับ ไม่ได้นำขึ้น GitHub ให้จำลองหรือปรับแต่งในเครื่องของคุณเอง):
* **DATABASE_URL**: ลิงก์เชื่อมโยงไปยังฐานข้อมูล PostgreSQL (`dssi_borrow`)
* **GOOGLE_CLIENT_ID**: คีย์สำหรับล็อกอินผ่าน Google Sign-In จริง
* **ADMIN_EMAILS**: ลิสต์อีเมล Google ที่ได้รับสิทธิ์ให้เป็น Admin (คั่นด้วยเครื่องหมายจุลภาค `,`)
