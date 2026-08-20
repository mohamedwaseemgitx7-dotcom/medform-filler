# Supabase Setup Guide & Row-Level Security (RLS)

This guide explains how to connect Supabase PostgreSQL database to MedForms Pro for multi-doctor isolation, authentication, and real-time syncing.

---

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create a free project.
2. Select your desired region.
3. Once provisioned, navigate to **Project Settings -> API**.
4. Copy the **Project URL** and the **Anon Public Key**.

---

### 2. Run the Database Schema & RLS Script
1. In your Supabase dashboard, click **SQL Editor**.
2. Open the file `supabase-schema.sql` located at the root of this project.
3. Paste the contents into the SQL Editor and click **Run**.
4. This will create:
   - `doctor_profiles` table with RLS.
   - `patient_records` table with strict doctor-partition RLS policies (`auth.uid() = doctor_id`).
   - Indices and automatic updated timestamp triggers.

---

### 3. Connect Supabase to MedForms Pro
There are two easy methods:

#### Method A: Environment Variables
Add to your `.env` or `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Method B: In-App Settings UI
1. Launch MedForms Pro.
2. Click **Settings** in the top navigation bar.
3. Select the **Supabase Cloud Setup** tab.
4. Enter your Supabase Project URL and Anon Public Key, then click **Save Supabase Config**.

---

### 4. Enable Google Sign-In in Supabase (Optional)
1. In Supabase Dashboard, go to **Authentication -> Providers -> Google**.
2. Toggle **Enable Google provider**.
3. Enter your Google Client ID and Google Client Secret from Google Cloud Console.
4. Add the Supabase Redirect URL to your Google Cloud Console Authorized redirect URIs.
