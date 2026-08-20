# Google Workspace (Sheets & Drive) Setup Guide

This guide details the integration flow for synchronizing MedForms Pro clinical patient data into **Google Sheets (4-Tab Spreadsheet)** and archiving clinical PDF forms into **Google Drive**.

---

### 1. Features
- **4-Tab Synchronized Spreadsheet**:
  - `Adult_Records`: Adult CPB Perfusion & Blood Gas rows.
  - `Pediatric_Records`: Pediatric CPB Perfusion & Blood Gas rows.
  - `ECMO_Records`: ECMO run logs (VA, VV, VAV, VVA) with P1/P2 delta pressures and flows.
  - `IABP_Records`: Intra-Aortic Balloon Pump hemodynamic tracking & support rates.
- **Google Drive PDF Archiving**:
  - Direct upload of exact high-fidelity vector clinical PDFs into a dedicated `MedForms Pro Clinical Records` folder.

---

### 2. Google Cloud Console Setup
1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your Google Cloud Project.
3. Enable the following APIs:
   - **Google Sheets API**
   - **Google Drive API**
4. Configure OAuth Consent Screen:
   - User Type: Internal or External
   - App Name: `MedForms Pro`
   - Scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`
5. Create OAuth 2.0 Client ID:
   - Application Type: Web application
   - Authorized JavaScript origins: Add your app URL (e.g. `http://localhost:3000` or Cloud Run URL).
   - Authorized redirect URIs: Add your app URL.

---

### 3. In-App One-Click Connection
1. Click the **Google Sheets & Drive** button in the MedForms Pro top bar.
2. Click **Connect Google Workspace Account**.
3. Select your Google account and grant permissions.
4. Click **Create & Sync 4-Tab Spreadsheet** to create the workbook.
5. Click **Archive PDFs to Google Drive** to push all compiled clinical sheets to Drive.
