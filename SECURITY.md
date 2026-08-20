# MedForms Pro - Security Architecture & Defense-in-Depth Specification

This document details the implementation and operational procedures for all 20 enterprise security controls enforced across the MedForms Pro Perfusion & ICU Clinical Platform.

---

### 1. Hide API Keys
- Server-side environment secrets (`GEMINI_API_KEY`, Supabase Service Role keys) are strictly isolated and never sent to or bundled into browser assets.
- Public client identifiers (e.g. Supabase Anon key) are sandboxed and restricted via Row-Level Security (RLS) policies.

### 2. Purge Git Secrets
- `.gitignore` rigorously prevents tracking `.env`, `.env.local`, credential tokens, service account JSON files, and build artifacts.
- Automated static analysis and pre-commit checks ensure zero hardcoded secrets exist in repository commits.

### 3. Use Public DB Key
- The client application interacts with Supabase exclusively via the low-privilege anonymous public key (`anon key`).
- Direct administrative database access is forbidden from client runtimes.

### 4. Enable Row-Level Security (RLS)
- Every PostgreSQL table (`doctor_profiles`, `patient_records`, `audit_logs`) has Row-Level Security enabled:
  ```sql
  ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "Doctors access only their own records"
  ON patient_records
  FOR ALL
  USING (auth.uid() = doctor_id);
  ```

### 5. Encrypt Sensitive Data
- In Transit: Forced TLS 1.3 encryption across all HTTPS endpoints.
- At Rest: Database tables encrypted using AES-256 in Supabase storage engines.
- Sensitive clinical notes and PHI (Protected Health Information) pass through cryptographic encoding before storage.

### 6. Enforce Server-Side Auth
- Every backend request validates the user's JSON Web Token (JWT) issued by Supabase Auth / Google OAuth.
- Client state is treated as untrusted; server-side verification confirms `auth.uid()` before granting data access.

### 7. Lock Record Access
- Multi-tenancy is enforced per doctor ID.
- Cross-practitioner data queries are structurally blocked by database constraints and local isolated partitioning.

### 8. Block Field Tampering
- Critical identifiers (Patient ID `MF-XXXXXX`, creation timestamps, and doctor ownership IDs) are enforced as immutable once created.
- Form submissions validate field formats before persistence.

### 9. Secure Session Cookies & Storage
- Authentication tokens utilize secure storage with auto-refresh intervals.
- OAuth callbacks follow state parameter nonce validation to eliminate CSRF vulnerabilities.

### 10. Hash Passwords
- All practitioner credentials use Argon2 / Bcrypt cryptographic salt & hashing powered by Supabase Auth engine.
- Plaintext passwords are never stored, logged, or transmitted in unencrypted form.

### 11. Rate Limit Login
- In-memory and server-side rate limiters track failed authentication attempts per email/IP.
- Enforces progressive delays and a 3-minute lockout window upon 5 consecutive failed attempts.

### 12. Add Bot Protection
- Login and registration flows enforce rapid submission detection and payload verification to prevent automated credential stuffing.

### 13. Parameterize Queries
- All database queries run through Supabase PostgREST prepared statements and parameterized queries, completely neutralizing SQL Injection attacks.

### 14. Validate All Input
- Client and database schemas validate clinical ranges (BSA, Flows, Blood Gas pH, pO2, pCO2, Anticoagulation ACT values).
- Rejects malformed or out-of-range clinical parameters.

### 15. Escape User Content
- All patient names, diagnoses, surgeon names, and clinical notes are sanitized and HTML-entity-escaped before PDF compilation and HTML preview rendering to eliminate XSS.

### 16. Restrict File Uploads
- File transfers (e.g. bulk clinical export, sheets synchronization) restrict MIME types to approved formats (`.pdf`, `.json`, `.zip`).
- Max payload size checks prevent denial-of-service via memory exhaustion.

### 17. Trim API Responses
- Database queries project only necessary clinical columns and exclude internal metadata or administrative credentials.

### 18. Add Security Headers
- Production ingress layers set:
  - `Content-Security-Policy: default-src 'self' ...`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 19. Force HTTPS
- HTTP traffic is permanently redirected to HTTPS with HSTS enabled on Cloud Run and reverse proxies.

### 20. Scan Dependencies
- Continuous vulnerability scanning via `npm audit` ensures all dependencies are free of critical CVEs and vulnerabilities.
