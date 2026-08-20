import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { DoctorProfile, PatientRecord } from '../types';

// Default Supabase configuration keys loaded from Vite environment variables (Settings / .env)
const DEFAULT_SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const DEFAULT_SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

const SUPABASE_CONFIG_STORAGE_KEY = 'medforms_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const stored = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          isCustom: true,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored Supabase config:', e);
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    isCustom: false,
  };
}

export function saveSupabaseConfig(config: { url: string; anonKey: string }): boolean {
  try {
    const url = config.url.trim();
    const anonKey = config.anonKey.trim();
    localStorage.setItem(
      SUPABASE_CONFIG_STORAGE_KEY,
      JSON.stringify({
        url,
        anonKey,
        isCustom: true,
      })
    );
    // Re-initialize client
    initSupabaseClient();
    return true;
  } catch (e) {
    console.error('Failed to save Supabase config:', e);
    return false;
  }
}

export function clearCustomSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_CONFIG_STORAGE_KEY);
  initSupabaseClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      supabaseInstance = null;
      return null;
    }
  }
  supabaseInstance = null;
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    return initSupabaseClient();
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

/**
 * Tests connection with the configured Supabase client.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Anon Public Key is missing.',
    };
  }

  try {
    // Attempt a light ping by querying the public schema or patient_records
    const { error } = await client.from('patient_records').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet or connection issue
      if (error.message.includes('relation "public.patient_records" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! (Tables pending: please run supabase-schema.sql in SQL editor).',
        };
      }
      // RLS or other standard code is still a successful connectivity check
      return {
        success: true,
        message: `Connected to Supabase (${error.message || 'Ready'}).`,
      };
    }
    return {
      success: true,
      message: 'Connected successfully to Supabase PostgreSQL database.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to connect to Supabase.',
    };
  }
}

/**
 * Syncs a single patient record to Supabase if configured.
 */
export async function syncRecordToSupabase(record: PatientRecord): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const payload = {
      id: record.id,
      doctor_id: record.doctorId,
      patient_id: record.patientId,
      patient_name: record.patientName,
      form_type: record.formType,
      status: record.status,
      data: record.data,
      updated_at: record.updatedAt || new Date().toISOString(),
    };

    const { error } = await client.from('patient_records').upsert(payload);
    if (error) {
      console.warn('Supabase upsert note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Could not sync record to Supabase:', err);
    return false;
  }
}

/**
 * Initiates Supabase Google OAuth Flow
 * Redirects user seamlessly to Google sign in via Supabase Auth without restricted scope blocks.
 */
export async function signInWithSupabaseGoogleOAuth(redirectTo?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase is not configured yet. Please configure Supabase URL & Anon Key.' };
  }

  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase Google OAuth initialization failed.' };
  }
}

/**
 * Deletes a record from Supabase if configured.
 */
export async function deleteRecordFromSupabase(recordId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client.from('patient_records').delete().eq('id', recordId);
    if (error) {
      console.warn('Supabase delete note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Could not delete record from Supabase:', err);
    return false;
  }
}

