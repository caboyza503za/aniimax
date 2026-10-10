# แผนการดำเนินงาน: แปลงโฉมหน้าตา Aniimax สไตล์ Cozy & Modern Game Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to execute this plan.

---

## สรุปภาพรวม (Overview)
แผนการปรับปรุงหน้าตา (Redesign) ของเว็บแอปพลิเคชัน Aniimax จากเดิมที่เป็นเครื่องมือหน้าแคบแบบวิศวกรรม ($880\text{px}$) ให้กลายเป็น **Cozy & Modern Game Dashboard** ขนาดกว้างเต็มตา ($1200\text{px}$) ที่มีมู้ดโทนของเกม Aniimo นุ่มนวล อบอุ่น ทันสมัย ขอบมน $16\text{px}$ พร้อมการ์ดสรุปผลงานระดับ Hero KPI ที่เห็นตัวเลขสำคัญทันที

---

## โครงสร้างไฟล์ที่เกี่ยวข้อง (File Structure)
- [`web/style.css`](file:///C:/Users/caboy/.gemini/antigravity/scratch/aniimax/web/style.css): ไฟล์หลักสำหรับ Design Tokens, ธีมมืด/สว่าง, เลย์เอาต์ Dashboard, การ์ด, ป้าย Badge, ตาราง, และ Responsive CSS
- [`web/index.html`](file:///C:/Users/caboy/.gemini/antigravity/scratch/aniimax/web/index.html): โครงสร้างส่วนหัวและคอนเทนเนอร์ Hero Metrics สำหรับสรุปผล
- [`web/app.js`](file:///C:/Users/caboy/.gemini/antigravity/scratch/aniimax/web/app.js): ฟังก์ชันช่วยจัดรูปแบบและแสดงผล Hero KPI Cards และตาราง

---

## ขั้นตอนการทำงาน (Step-by-Step Tasks)

### งานที่ 1: อัพเดท Design Tokens & เลย์เอาต์หลัก (CSS Tokens & Base Layout)
- **เป้าหมาย:** ปรับค่าสีตัวแปร CSS, ขยาย `max-width` เป็น `1200px`, จัดการฟอนต์และพื้นหลัง
- **ขั้นตอน:**
  1. ใน `web/style.css`: ปรับแต่ง `:root` (Dark Theme) ให้ใช้สี Deep Slate (`#0d1117`), Surface (`#161c24`), Accent Emerald (`#10b981`), Border (`rgba(255, 255, 255, 0.08)`)
  2. ปรับแต่ง `.light` (Light Theme) ให้ใช้สี Warm Linen (`#f8f7f4`), White Card (`#ffffff`), Accent Green (`#059669`)
  3. ปรับ `body`: ขยาย `max-width: 1200px`, เพิ่มรัศมีความโค้งมน `--radius: 16px`, ปรับความลึกเงา `box-shadow`
  4. เพิ่ม Custom Scrollbar สไตล์โมเดิร์น

### งานที่ 2: ปรับโฉมส่วนหัวและแถบเมนู (Header & Brand Bar)
- **เป้าหมาย:** ส่วนหัวสไตล์เกมโมเดิร์น สวยงามและเข้าถึงง่าย
- **ขั้นตอน:**
  1. ใน `web/style.css`: ปรับแต่ง `.header` ให้มีระยะขอบมน นุ่มนวล พร้อมแถบโลโก้ Aniimax
  2. ปรับแต่งปุ่มเปลี่ยนภาษา (Language Dropdown) และปุ่มสลับธีม (Theme Toggle) ให้เป็นการ์ดกลมมนแบบ Glassmorphism
  3. ปรับปุ่มคัดลอกลิงก์แชร์ (Share Link) ให้มีไอคอนและแอนิเมชันกดที่นุ่มนวล

### งานที่ 3: ออกแบบแถบ Hero KPI Metrics Dashboard
- **เป้าหมาย:** สรุปตัวเลขอัตราการผลิต, เวลาถึงเป้าหมาย, และการประหยัดคนงานแบบโดดเด่นสะดุดตา
- **ขั้นตอน:**
  1. ใน `web/index.html`: จัดกลุ่มส่วนสรุปผล `#plan-rate` และ `#total-time` ให้อยู่ในโครงสร้าง `.hero-metrics-grid`
  2. ใน `web/style.css`: สร้างคลาส `.hero-metric-card` ที่มีตัวเลขขนาดใหญ่ แสง Glow สีเขียว/ทอง และไอคอนกำกับชัดเจน
  3. ปรับแต่งการ์ดเวลาเป้าหมาย (Time to Goal) ให้เป็นระเบียบ สบายตา

### งานที่ 4: ปรับแต่งแถบตัวเลือกและการ์ดโรงงาน (Pills & Facilities Grid)
- **เป้าหมาย:** ส่วนป้อนข้อมูลเป็นมิตร กดง่าย คล้ายช่องกระเป๋าหรือหน้าจอสร้างฐานในเกม
- **ขั้นตอน:**
  1. ใน `web/style.css`: ปรับปรุงปุ่มสลับโหมดกลยุทธ์ (Strategies) และโหมด Simple/Advanced ให้เป็นสไตล์ Segmented Pill Control
  2. ปรับการ์ดโรงงาน (`.facility-card`) ให้มีมิติ มีเอฟเฟกต์ยกตัวเมื่อเมาส์ชี้ (`transform: translateY(-2px)`)
  3. ปรับแต่งกล่อง Input ตัวเลข เลเวล และปุ่ม `+ Add level` ให้โค้งมนและสะอาดตา

### งานที่ 5: ปรับปรุงตาราง แผนผังบ้าน และป้าย Badge (Tables & Visual Polish)
- **เป้าหมาย:** ตารางอ่านง่าย มี Sticky Header, แผนที่จำลองบ้าน และป้ายโหมด E สีทองสดใส
- **ขั้นตอน:**
  1. ใน `web/style.css`: ปรับแต่ง `.facility-plan-table` และ `.aniimo-table` ให้มี Sticky Header, สลับสีแถวอ่อนๆ, ขอบมนสวยงาม
  2. ปรับแต่ง `.emode-badge` และ `.emode-savings-banner` ให้เด่นชัดด้วยสีทองและไอคอนสายฟ้า
  3. ปรับแต่งคอลัมน์สีธาตุแอนีโม (`.ability-col`) ให้มีเส้นขอบและไอคอนที่คมชัด
  4. ตกแต่งกรอบแผนผังบ้าน (`#homeland-grid` / `#homeland-svg`) ให้ดูเป็นกรอบแผนที่เกมน่ารัก

### งานที่ 6: ตรวจสอบและทดสอบผลลัพธ์ (Verification & Commit)
- **เป้าหมาย:** มั่นใจว่าฟังก์ชันทั้งหมดและชุดทดสอบยังทำงานถูกต้อง 100%
- **ขั้นตอน:**
  1. รันชุดทดสอบ `node --test` ตรวจสอบทั้ง 29 tests ว่าผ่านครบ
  2. Commit และ Push การเปลี่ยนแปลงขึ้น GitHub
