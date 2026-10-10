# Design Spec: Aniimax Cozy & Modern Game UI Redesign
**Date:** 2026-10-10  
**Status:** In Review / Approved by User

---

## 1. Goal & Vision
Redesign Aniimax's web interface from a utilitarian, narrow-column tool into a vibrant, modern, cozy game dashboard tailored to the *Aniimo* game universe. The new interface will feel polished, engaging, and spacious, while keeping 100% of the underlying solver functionality and mobile responsiveness intact.

---

## 2. Key Visual Pillars
1. **Cozy Game Aesthetics:** Warm, rounded, and welcoming UI components (16px card border radius, soft borders, subtle gradients).
2. **Modern Dashboard Layout:** Expand width from `880px` to `1200px` on desktop, with responsive card grids and hero metric highlights.
3. **Hero KPI Cards:** Prominent display of core rates (Coins/Hour, Time to Goal, Aniimo worker status, and E-Mode power savings).
4. **Enhanced Data Legibility:** Polished tables with alternating row tones, sticky headers, vivid ability tags, and distinctive status badges.
5. **Seamless Dark & Light Mode:** Both modes tuned with balanced contrast, readable text, and theme transitions.

---

## 3. Design System & Tokens

### Color Palette
- **Dark Mode (Default):**
  - `--bg`: `#0d1117` (Deep slate background)
  - `--surface`: `#161c24` (Card surface)
  - `--surface-2`: `#1f2732` (Input and nested surface)
  - `--surface-card-hover`: `#242d3a`
  - `--border`: `rgba(255, 255, 255, 0.08)`
  - `--border-active`: `#10b981`
  - `--text`: `#f1f5f9`
  - `--text-muted`: `#94a3b8`
  - `--accent`: `#10b981` (Cozy Emerald)
  - `--accent-hover`: `#059669`
  - `--gold-electric`: `#f59e0b` (E-Mode gold)
  - `--badge-bg`: `rgba(16, 185, 129, 0.12)`

- **Light Mode:**
  - `--bg`: `#f8f7f4` (Warm cream/linen)
  - `--surface`: `#ffffff` (Pure white card)
  - `--surface-2`: `#f1ede4` (Soft paper)
  - `--border`: `#e2ded4`
  - `--text`: `#1e293b`
  - `--text-muted`: `#64748b`
  - `--accent`: `#059669`
  - `--gold-electric`: `#d97706`

### Typography & Spacing
- Font family: Inter, system-ui, -apple-system, sans-serif
- Responsive max-width: `1200px`
- Card padding: `1.25rem` to `1.5rem`
- Border-radius: `16px` for cards, `10px` for buttons/inputs, `999px` for badges/pills
- Subtle shadows: `0 8px 24px -4px rgba(0, 0, 0, 0.2)`

---

## 4. Component Layout & Structure

### Header & Navigation
- Modern top bar with cozy logo branding, version tag, language selector dropdown, share button, and dark/light toggle.
- Clean header shadow and alignment.

### Hero Result Metrics (เมื่อคำนวณเสร็จ)
- Hero grid showing 3 cards:
  1. **อัตราการผลิตหลัก (Your Rate):** ตัวเลขใหญ่เด่นชัด (เช่น `1,250,000 Coins / hour`)
  2. **เวลาถึงเป้าหมาย (Time to Goal):** เช่น `3 hours 15 mins`
  3. **การประหยัดคนงาน (E-Mode & Workers):** ป้าย `⚡ โหมด E ประหยัดได้ X ตำแหน่ง`

### Config & Input Sections
- **Strategy & Mode Tabs:** ดีไซน์สไตล์ Segmented Control / Pill tabs กดง่าย
- **Facilities Grid:** ปรับการ์ดโรงงานเป็นกริดการ์ดที่โค้งมน มีไอคอนและสเต็ปเปอร์เลเวลที่ดูสะอาดตา
- **Aniimo Roster / Best Setup:** การ์ดจัดทีมแสดงสีธาตุสดใสตามเกม

### Tables & Homeland Diagram
- **Facility Plan & Summary Tables:**
  - หัวตารางลอย (Sticky header) พร้อมเงาบางเบา
  - แถวตารางมีระยะ padding พอเหมาะ สบายตา ไม่แออัด
  - ป้าย `⚡ E-Mode` สีทองสว่าง สะดุดตา
- **Homeland Map Canvas:** กรอบแผนที่โมเดิร์นพร้อมเส้นกริดจำลองที่อ่านง่าย

---

## 5. Scope & Constraints
- ไม่แก้โค้ด WASM Solver หรือฟังก์ชัน Logic ใน Rust
- อัพเดท `web/style.css` และส่วน HTML โครงสร้างใน `web/index.html` ให้รองรับ Hero Metrics และขยายหน้ากว้าง
- รองรับ Responsive บนมือถือ (Mobile layout stacking) อย่างสมบูรณ์
- รันชุดทดสอบ `node --test` ผ่านครบทุกข้อเหมือนเดิม
