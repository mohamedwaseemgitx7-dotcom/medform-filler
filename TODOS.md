# MedForms Pro - Project Roadmap & Antigravity Agent Tasks

This document maintains development tasks and execution checklists for developers and Antigravity agents.

---

## 🎯 Completed Core Features

- [x] **Single Doctor Authentication Flow**:
  - [x] Removed multi-account avatar switcher and human photo images.
  - [x] Switched all iconography to medical equipment & clinical symbols (Stethoscope, Caduceus, ECG pulse, Perfusion pump).
  - [x] Single practitioner vault session with email sign in, account creation, and "Continue with Google".
  - [x] Onboarding prompt asking for Doctor Name and Hospital Name on fresh account sign in.

- [x] **Supabase Integration & RLS Isolation**:
  - [x] Client initialization in `src/utils/supabaseClient.ts`.
  - [x] Supabase Postgres schema with RLS in `supabase-schema.sql`.
  - [x] Complete doctor partition isolation (`auth.uid() = doctor_id`).
  - [x] In-app Supabase configuration and credentials manager in Settings modal.

- [x] **Practitioner Settings**:
  - [x] Removed mock "Data Tools" button from Dashboard.
  - [x] Added prominent **Settings** button in Navbar and Dashboard.
  - [x] Editable Doctor Name, Hospital Name, Department, Clinical Role, and Medical License.

- [x] **Comprehensive State Feedback**:
  - [x] `No items yet` (Empty state with medical equipment illustration & CTA).
  - [x] `Loading state` (Pulse ECG loader with status text).
  - [x] `Error state` (Retryable error banner with details).
  - [x] `No internet connection` (Live offline status banner with local storage caching).
  - [x] `It's taking longer than usual` (Latency watcher banner).
  - [x] `Permission denied` (RLS access violation modal).
  - [x] `Session expired` (Confidentiality timeout prompt preserving draft data).
  - [x] `Form validation successful` (Confirmation toast & banner).

- [x] **Enterprise Security (20 Defense-in-Depth Controls)**:
  - [x] Documented in `SECURITY.md` (Confidential, not rendered in public web UI).
  - [x] Implemented in `src/utils/security.ts` (Rate limiting, XSS sanitization, parameter validation).

- [x] **Form Style & Export Preservation**:
  - [x] Strict preservation of all clinical data sheets (`ExactDocumentSheet.tsx`).
  - [x] Vector PDF download style preserved (`pdfExport.ts`).
  - [x] HTML export preserved (`htmlExport.ts`).
  - [x] Bulk ZIP export preserved (`BulkZipModal.tsx`).

---

## 🚀 Antigravity Agent Instructions & Next Steps

When downloading and executing this repository in Antigravity or local environments:

1. **Prerequisites & Cross-Platform Support**:
   - Works on Windows, macOS, Linux, iOS (Safari), and Android (Chrome).
   - Node.js 18+ or Bun.
   - Run `npm install` to install all dependencies.
   - Run `npm run dev` to start on `http://localhost:3000`.

2. **Supabase Setup**:
   - Run `supabase-schema.sql` in your Supabase SQL editor.
   - Configure credentials in `.env` or in the in-app **Settings -> Supabase Cloud Setup** tab.

3. **Google Workspace Sync**:
   - Refer to `/setup/google-workspace-setup.md` for Google Cloud OAuth configuration.
   - Use the **Google Sheets & Drive** button in the app to sync 4-tab spreadsheets and backup PDFs.
