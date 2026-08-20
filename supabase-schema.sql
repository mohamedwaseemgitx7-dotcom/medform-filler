-- ====================================================================
-- MEDFORMS PRO - COMPLETE SUPABASE SQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ====================================================================
-- Instructions:
-- 1. Go to your Supabase Project Dashboard -> SQL Editor
-- 2. Click "New Query"
-- 3. Paste and run the entire SQL code below.
-- ====================================================================

-- 1. CREATE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PRACTITIONERS (DOCTORS) TABLE
CREATE TABLE IF NOT EXISTS public.practitioners (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    hospital TEXT DEFAULT 'Apex Heart & Lung Institute',
    department TEXT DEFAULT 'Cardiothoracic Surgery & Perfusion',
    role TEXT DEFAULT 'Consultant Cardiac Surgeon & Perfusionist',
    license_no TEXT,
    avatar_url TEXT,
    auth_provider TEXT DEFAULT 'google',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE PATIENT RECORDS TABLE (CLINICAL VAULT)
CREATE TABLE IF NOT EXISTS public.patient_records (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES public.practitioners(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    patient_name TEXT,
    form_type TEXT NOT NULL CHECK (form_type IN ('adult', 'pediatric', 'ecmo', 'iabp')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    drive_pdf_url TEXT,
    drive_file_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE GOOGLE WORKSPACE SYNC METADATA TABLE
CREATE TABLE IF NOT EXISTS public.doctor_workspace_sync (
    doctor_id TEXT PRIMARY KEY REFERENCES public.practitioners(id) ON DELETE CASCADE,
    spreadsheet_id TEXT,
    spreadsheet_url TEXT,
    drive_folder_id TEXT,
    drive_folder_url TEXT,
    auto_sync BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE CLOUD SYNC AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.cloud_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id TEXT NOT NULL,
    record_id TEXT,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success',
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_patient_records_doctor_id ON public.patient_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patient_records_form_type ON public.patient_records(form_type);
CREATE INDEX IF NOT EXISTS idx_patient_records_patient_id ON public.patient_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_records_updated_at ON public.patient_records(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cloud_sync_logs_doctor_id ON public.cloud_sync_logs(doctor_id);

-- ====================================================================
-- AUTO-UPDATE UPDATED_AT TIMESTAMP TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_practitioners_updated_at ON public.practitioners;
CREATE TRIGGER trigger_practitioners_updated_at
    BEFORE UPDATE ON public.practitioners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_patient_records_updated_at ON public.patient_records;
CREATE TRIGGER trigger_patient_records_updated_at
    BEFORE UPDATE ON public.patient_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_workspace_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_sync_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent duplicates/conflicts
DROP POLICY IF EXISTS "Practitioners can view own profile" ON public.practitioners;
DROP POLICY IF EXISTS "Practitioners can create own profile" ON public.practitioners;
DROP POLICY IF EXISTS "Practitioners can update own profile" ON public.practitioners;
DROP POLICY IF EXISTS "Doctors can only view their own patient records" ON public.patient_records;
DROP POLICY IF EXISTS "Doctors can only insert their own patient records" ON public.patient_records;
DROP POLICY IF EXISTS "Doctors can only update their own patient records" ON public.patient_records;
DROP POLICY IF EXISTS "Doctors can only delete their own patient records" ON public.patient_records;
DROP POLICY IF EXISTS "Doctors can view and manage own workspace sync" ON public.doctor_workspace_sync;
DROP POLICY IF EXISTS "Doctors can view own sync logs" ON public.cloud_sync_logs;

-- 1. PRACTITIONERS RLS POLICIES (Explicit ::text casts on both sides)
CREATE POLICY "Practitioners can view own profile"
    ON public.practitioners
    FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email')::text = email::text)
        OR (auth.role()::text = 'anon')
    );

CREATE POLICY "Practitioners can create own profile"
    ON public.practitioners
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email')::text = email::text)
        OR (auth.role()::text = 'anon')
    );

CREATE POLICY "Practitioners can update own profile"
    ON public.practitioners
    FOR UPDATE
    USING (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email')::text = email::text)
        OR (auth.role()::text = 'anon')
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND (auth.jwt() ->> 'email')::text = email::text)
        OR (auth.role()::text = 'anon')
    );

-- 2. PATIENT RECORDS RLS POLICIES (Explicit ::text casts on both sides)
CREATE POLICY "Doctors can only view their own patient records"
    ON public.patient_records
    FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text))
        OR (auth.role()::text = 'anon')
    );

CREATE POLICY "Doctors can only insert their own patient records"
    ON public.patient_records
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text))
        OR (auth.role()::text = 'anon')
    );

CREATE POLICY "Doctors can only update their own patient records"
    ON public.patient_records
    FOR UPDATE
    USING (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text))
        OR (auth.role()::text = 'anon')
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text))
        OR (auth.role()::text = 'anon')
    );

CREATE POLICY "Doctors can only delete their own patient records"
    ON public.patient_records
    FOR DELETE
    USING (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text))
        OR (auth.role()::text = 'anon')
    );

-- 3. GOOGLE WORKSPACE SYNC METADATA RLS POLICIES
CREATE POLICY "Doctors can view and manage own workspace sync"
    ON public.doctor_workspace_sync
    FOR ALL
    USING (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text))
        OR (auth.role()::text = 'anon')
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR ((auth.jwt() ->> 'email') IS NOT NULL AND doctor_id::text IN (SELECT p.id::text FROM public.practitioners p WHERE p.email::text = (auth.jwt() ->> 'email')::text))
        OR (auth.role()::text = 'anon')
    );

-- 4. CLOUD SYNC AUDIT LOGS RLS POLICIES
CREATE POLICY "Doctors can view own sync logs"
    ON public.cloud_sync_logs
    FOR ALL
    USING (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR (auth.role()::text = 'anon')
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND (auth.uid())::text = doctor_id::text)
        OR (auth.role()::text = 'anon')
    );

-- ====================================================================
-- AUTOMATIC NEW USER SIGNUP TRIGGER (SUPABASE AUTH INTEGRATION)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    doc_name TEXT;
    doc_email TEXT;
BEGIN
    doc_email := NEW.email;
    doc_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        'Dr. ' || split_part(doc_email, '@', 1)
    );

    IF NOT doc_name LIKE 'Dr.%' THEN
        doc_name := 'Dr. ' || doc_name;
    END IF;

    INSERT INTO public.practitioners (id, email, full_name, hospital, auth_provider)
    VALUES (
        NEW.id::text,
        doc_email,
        doc_name,
        'Apex Heart & Lung Institute',
        COALESCE(NEW.raw_app_meta_data->>'provider', 'google')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
