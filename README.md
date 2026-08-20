# MedForms Pro - Perfusion & ICU Clinical Document Registry

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmohamedwaseemgitx7-dotcom%2Fmedform-filler)

MedForms Pro is an enterprise clinical documentation and perfusion management system designed for cardiac surgeons, perfusionists, and ICU intensivists. It delivers exact clinical document fidelity, multi-doctor database isolation via PostgreSQL Row-Level Security (RLS) in Supabase, Google Workspace integration (4-tab Google Sheets sync & Google Drive PDF archiving), and offline-first client architecture.


---

## 🌟 Key Capabilities

1. **Exact Clinical Forms Registry**:
   - **Adult Cardiac CPB Data Sheet**: Complete cannulation, priming fluid gain/loss, blood gas progression, cardioplegia dosings, and hemodynamics.
   - **Pediatric Cardiac CPB Data Sheet**: Pediatric flow indexes, prime fluid balance, and arterial blood gas monitoring.
   - **ECMO Data Sheet**: Extracorporeal Membrane Oxygenation (VA, VV, VAV, VVA) pressure runs, flow rates, and cannulation.
   - **IABP Data Sheet**: Intra-Aortic Balloon Pump ratios, trigger modes, augmentation pressures, and support inotropes.

2. **Single Doctor Authentication & Database Isolation**:
   - Clean, single-practitioner vault.
   - Email sign in, account creation, and Google sign in.
   - Initial onboarding workflow to capture Doctor Name and Hospital Name.
   - In-app **Settings** panel to edit doctor identity and hospital credentials anytime.
   - Multi-tenant data partitioning powered by Supabase Row-Level Security (`auth.uid() = doctor_id`).

3. **Google Workspace Synchronization**:
   - **4-Tab Google Sheets Integration**: `Adult_Records`, `Pediatric_Records`, `ECMO_Records`, and `IABP_Records`.
   - **Google Drive PDF Archiving**: Automated vector PDF upload to a dedicated clinical folder in Drive.

4. **Comprehensive System States**:
   - `No items yet` (Empty state with medical equipment iconography).
   - `Loading state` (Clinical pulse indicator).
   - `Error state` (Retryable notification banner).
   - `No internet connection` (Offline mode detector with local storage caching).
   - `It's taking longer than usual` (Latency watcher).
   - `Permission denied` (Access control alert).
   - `Session expired` (Confidentiality re-login prompt preserving draft forms).
   - `Form validation successful` (Confirmation toasts and validation feedback).

5. **20 Defense-in-Depth Security Controls**:
   - Documented in `SECURITY.md` (Confidential reference).
   - Implemented via `src/utils/security.ts` and `supabase-schema.sql`.

---

## 🛠️ Tech Stack & Requirements

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS v4, Lucide React (Clinical equipment icons).
- **Backend / Database**: Supabase PostgreSQL with Row-Level Security (RLS) + Google Workspace APIs.
- **Export Engines**: jsPDF vector generation, html2canvas, JSZip, FileSaver.
- **Cross-Platform Compatibility**: macOS, Linux, Windows, iOS, Android.

---

## 🚀 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

---

## 📂 Setup Documentation

- [Google Workspace Setup Guide](setup/google-workspace-setup.md)
- [Supabase Database & RLS Guide](setup/supabase-setup.md)
- [Antigravity Project Roadmap & Tasks](TODOS.md)
- [Enterprise Security Specification](SECURITY.md)
