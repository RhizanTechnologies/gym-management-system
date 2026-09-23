# Gym Management System (GymOS PWA)

> A modern, full-stack Progressive Web App (PWA) designed for gym operations, member digital ID passes, high-speed QR check-in, bilingual localization, official receipt generation, and real-time executive analytics. Configured for **M Fitness and Gym** (Figa, Addis Ababa • `0961889867`).

---

## 🌟 Core Features

- **📸 Multi-Mode Camera QR Check-In (`/checkin`)**:
  - **Native Phone Camera Snap**: Opens the device's native camera immediately full-screen (`capture="environment"`) to snap and decode member QR passes.
  - **Gallery / Screenshot Upload**: Client-side multi-pass image processing using `jsQR` with contrast optimization and downsampling.
  - **Live Webcam Stream**: Continuous video viewfinder using `Html5Qrcode` with camera switching.
  - **Real-Time Identity & Locker Verification**: Instantly displays member photo avatar, active plan duration, and assigned locker.

- **🗓️ Calendar-Based Membership Engine**:
  - Membership days count down day-by-day according to the calendar date regardless of attendance.
  - Door scans authenticate entry, log capacity, and assign lockers **without consuming extra days per scan**.

- **🪪 Member Digital Pass PWA (`/member-portal`)**:
  - Mobile-responsive digital gym pass for smartphones.
  - Dynamic QR cryptographic token, assigned locker number, workout streak counter, and remaining days.

- **🇪🇹 Bilingual English & Amharic Localization (አማርኛ)**:
  - 1-tap `EN` / `አማርኛ` switcher in the top navigation bar.
  - Amharic terminology tailored for Ethiopian gym staff and members (*የአባል ዲጂታል ፓስ*, *የቀሩት ቀናት*, *የመቆለፊያ ቁጥር*, etc.).

- **🧾 Rapid 60-Second Onboarding & Sequential Receipts (`/members`)**:
  - Fast member registration with package selection and initial payment recording.
  - Auto-generated sequential receipts (`RCP-2026-xxxx`), printable invoices, and instant digital pass issuance.

- **📊 Owner Executive Dashboard & Analytics (`/dashboard` & `/reports`)**:
  - Live floor occupancy meter updated dynamically on check-in.
  - Revenue tracking, active vs. expired member distribution, and payment method summaries.
  - 1-click bilingual **WhatsApp renewal notices** addressed to members.

- **🔒 Role-Based Access Control (RBAC)**:
  - Strict security boundaries for Receptionist, Maintenance Staff, and Owner.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Serverless Route Handlers)
- **UI & Styling**: React 19, TailwindCSS, Lucide Icons
- **Database & ORM**: PostgreSQL & Prisma ORM (`prisma/schema.prisma`)
- **QR Engine**: `jsQR`, `html5-qrcode`, `qrcode.react`
- **Testing**: Vitest (180 automated unit and integration tests across 15 test suites)
- **Runtime**: Node.js & pnpm

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
*(Optional: If connecting PostgreSQL, set `DATABASE_URL` in `.env`)*

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🧪 Testing & Validation

Run the automated test suite:
```bash
pnpm test
```

Run TypeScript type-checking:
```bash
npx tsc --noEmit
```

Build for production:
```bash
pnpm build
```

---

## ☁️ Deployment (Vercel)

This application is built as a unified full-stack system. **Only one single deployment is needed** for both the frontend PWA and backend API endpoints.

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Import Project** and select this repository.
3. In Project Settings → **Environment Variables**, add:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xyz.neon.tech/neondb?sslmode=require"
   ```
4. (Optional) Run the database migration script to seed PostgreSQL:
   ```bash
   pnpm tsx scripts/migrate-json-to-postgres.ts
   ```
5. Click **Deploy**. Vercel will build the app and deploy all API routes as serverless functions with automatic HTTPS.

---

## 📄 License
Private & Proprietary — Developed for Rhizan Technologies.
