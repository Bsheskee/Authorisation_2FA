# SecureAuth — Implementation Plan

## Overview
Full-stack 2FA authentication system (TOTP) using React + Vite frontend and Node.js + Express backend with SQLite.

### [x] Step 1: Project Setup
- Create directory structure (client/, server/, docs/)
- Add root .gitignore
- Add .env.example with required variables

### [x] Step 2: Backend Initialization
- npm init + install all dependencies in server/
- Configure tsconfig.json, nodemon.json
- Create src/index.ts with Express server (port 3001), CORS, helmet
- Add GET /health endpoint

### [x] Step 3: Frontend Initialization
- Create Vite React TS project in client/
- Install react-router-dom, axios
- Configure routing for all pages
- Create placeholder pages and services/api.ts

### [x] Step 4: Backend Phase 1A — Core Auth
- DB schema (users, audit_logs tables) + database.ts
- password.service.ts (bcrypt)
- jwt.service.ts (full + temp tokens)
- validators.ts (email + password strength)
- POST /api/auth/register
- POST /api/auth/login
- verifyJwt middleware + requireFullToken
- GET /api/user/dashboard

### [x] Step 5: Frontend Phase 1A — Core UI
- AuthContext.tsx
- ProtectedRoute.tsx
- RegisterPage.tsx
- LoginPage.tsx
- DashboardPage.tsx (with 2FA enable banner)

### [x] Step 6: Backend Phase 1B — TOTP
- totp.service.ts (generateSecret, generateQrCode, verifyCode)
- POST /api/auth/setup-totp
- POST /api/auth/confirm-totp
- POST /api/auth/verify-totp
- POST /api/auth/logout

### [x] Step 7: Frontend Phase 1B — TOTP UI
- TotpSetupPage.tsx
- TotpVerifyPage.tsx
- CodeInput.tsx component (6-digit, auto-advance)

### [x] Step 8: Phase 1C — Rate Limiting, Audit Log, Polish
- express-rate-limit on login/register/verify-totp routes
- auditLogger.ts middleware
- GET /api/user/audit-log endpoint
- Frontend: audit log table on Dashboard
- Frontend: error toasts, loading states

## Note: Node.js is not installed on the build machine.
## Run `npm install` in both server/ and client/ after installing Node.js 18+.
