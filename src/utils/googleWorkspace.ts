// Google Sheets & Drive API Integration for MedForms Pro
import { PatientRecord, FormType } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { exportElementToPdf } from './pdfExport';

export interface GoogleAuthState {
  isConnected: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  userEmail: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

// In-Memory Cached Token for Google Sheets & Drive API calls
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export function setCachedAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

const STORAGE_KEY_AUTH_PREFIX = 'medforms_google_auth_state_';

export function getDoctorGoogleAuth(doctorId: string = 'default'): GoogleAuthState {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AUTH_PREFIX}${doctorId}`);
    if (raw) {
      const parsed: GoogleAuthState = JSON.parse(raw);

      // Clean up legacy mock/invalid IDs
      if (
        parsed.driveFolderId?.startsWith('1DRV_') ||
        parsed.spreadsheetId?.startsWith('1MF') ||
        parsed.accessToken?.startsWith('ya29.medforms_')
      ) {
        parsed.isConnected = false;
        parsed.accessToken = null;
        parsed.driveFolderId = null;
        parsed.driveFolderUrl = null;
        parsed.spreadsheetId = null;
        parsed.spreadsheetUrl = null;
        localStorage.setItem(`${STORAGE_KEY_AUTH_PREFIX}${doctorId}`, JSON.stringify(parsed));
        return parsed;
      }

      // Check if expired
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        return {
          ...parsed,
          isConnected: false,
          accessToken: null,
        };
      }

      if (cachedAccessToken) {
        parsed.accessToken = cachedAccessToken;
        parsed.isConnected = true;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load Google Auth state', err);
  }

  return {
    isConnected: false,
    accessToken: null,
    expiresAt: null,
    userEmail: null,
    userName: null,
    userAvatar: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    driveFolderId: null,
    driveFolderUrl: null,
    lastSyncedAt: null,
    autoSync: false,
  };
}

export function getStoredGoogleAuth(): GoogleAuthState {
  return getDoctorGoogleAuth('default');
}

export function saveDoctorGoogleAuth(doctorId: string = 'default', state: Partial<GoogleAuthState>): GoogleAuthState {
  const current = getDoctorGoogleAuth(doctorId);
  const updated: GoogleAuthState = { ...current, ...state };
  if (state.accessToken) {
    cachedAccessToken = state.accessToken;
  }
  try {
    localStorage.setItem(`${STORAGE_KEY_AUTH_PREFIX}${doctorId}`, JSON.stringify(updated));
    localStorage.setItem(`${STORAGE_KEY_AUTH_PREFIX}default`, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save Google Auth state', err);
  }
  return updated;
}

export function saveGoogleAuth(state: Partial<GoogleAuthState>): GoogleAuthState {
  return saveDoctorGoogleAuth('default', state);
}

export function disconnectDoctorGoogleAuth(doctorId: string = 'default'): GoogleAuthState {
  cachedAccessToken = null;
  const cleared: GoogleAuthState = {
    isConnected: false,
    accessToken: null,
    expiresAt: null,
    userEmail: null,
    userName: null,
    userAvatar: null,
    spreadsheetId: null,
    spreadsheetUrl: null,
    driveFolderId: null,
    driveFolderUrl: null,
    lastSyncedAt: null,
    autoSync: false,
  };
  try {
    localStorage.setItem(`${STORAGE_KEY_AUTH_PREFIX}${doctorId}`, JSON.stringify(cleared));
    localStorage.setItem(`${STORAGE_KEY_AUTH_PREFIX}default`, JSON.stringify(cleared));
  } catch (err) {
    console.warn('Disconnect error:', err);
  }
  return cleared;
}

export function disconnectGoogleAuth(): GoogleAuthState {
  return disconnectDoctorGoogleAuth('default');
}

/**
 * Ensures Google Identity Services (GIS) client script is properly loaded
 */
function ensureGisLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      return resolve();
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      setTimeout(resolve, 1200);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
    setTimeout(resolve, 2000);
  });
}

/**
 * Fetches authenticated user's profile info (email, name, picture) from Google
 */
export async function fetchGoogleUserProfile(token: string): Promise<{ email: string; name?: string; picture?: string }> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return {
        email: data.email || 'Authenticated Google User',
        name: data.name || data.given_name || 'Practitioner',
        picture: data.picture,
      };
    }
  } catch (err) {
    console.warn('Could not fetch user profile from Google:', err);
  }
  return { email: 'Connected Google Account' };
}

/**
 * Request real token via Google Identity Services Token Client
 */
export async function requestGisAccessToken(
  promptType: string = 'select_account',
  customScope?: string
): Promise<{ accessToken: string; expiresIn: number }> {
  await ensureGisLoaded();

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services SDK could not be loaded. Please refresh the page.'));
    }

    let isSettled = false;
    let timeoutId: any = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    try {
      const clientId =
        firebaseConfig.oAuthClientId ||
        '532363914519-agvd2k3nt3gdp66j6l64m7go893tn6o9.apps.googleusercontent.com';

      const scope =
        customScope ||
        'email profile openid';

      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope,
        prompt: promptType,
        callback: (response: any) => {
          if (isSettled) return;
          isSettled = true;
          cleanup();

          if (response.error) {
            reject(new Error(response.error_description || response.error));
          } else if (response.access_token) {
            cachedAccessToken = response.access_token;
            resolve({
              accessToken: response.access_token,
              expiresIn: Number(response.expires_in) || 3599,
            });
          } else {
            reject(new Error('No access token returned by Google Identity Services.'));
          }
        },
        error_callback: (err: any) => {
          if (isSettled) return;
          isSettled = true;
          cleanup();
          reject(
            new Error(
              err?.message || err?.type === 'popup_closed'
                ? 'Google login popup was closed.'
                : 'Google authorization was cancelled.'
            )
          );
        },
      });

      timeoutId = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          reject(
            new Error(
              'Google authorization timed out or popup closed. Please try clicking Connect again.'
            )
          );
        }
      }, 75000);

      tokenClient.requestAccessToken({ prompt: promptType });
    } catch (err) {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        reject(err);
      }
    }
  });
}

/**
 * Primary Sign-in Flow with Google Workspace (Sheets & Drive) for any Google account
 */
export async function signInWithGoogleWorkspacePopup(
  doctorName: string = 'Doctor',
  doctorId: string = 'default',
  promptType?: string
): Promise<{ accessToken: string; spreadsheetId: string; spreadsheetUrl: string; folderId: string; folderUrl: string; userEmail: string }> {
  let token: string | null = null;

  isSigningIn = true;

  try {
    const gisRes = await requestGisAccessToken(
      promptType || 'select_account',
      'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
    );
    token = gisRes.accessToken;
  } catch (gisErr: any) {
    isSigningIn = false;
    console.error('Google Workspace GIS authorization error:', gisErr);
    throw new Error(
      gisErr.message || 'Google Workspace access was cancelled or blocked by the browser.'
    );
  }

  if (!token) {
    isSigningIn = false;
    throw new Error('Failed to acquire valid Google Workspace access token.');
  }

  cachedAccessToken = token;
  const expiresAt = Date.now() + 3600 * 1000;

  // Retrieve actual user info from Google
  const profile = await fetchGoogleUserProfile(token);
  const userEmail = profile.email;
  const userName = profile.name || doctorName;
  const userAvatar = profile.picture;

  // Create or get user's clinical Spreadsheet & Drive Folder
  const { spreadsheetId, spreadsheetUrl } = await createOrGetSpreadsheet(token, userName);
  const { folderId, folderUrl } = await createOrGetDriveFolder(token, `MedForms Pro Clinical Vault (${userName})`);

  saveDoctorGoogleAuth(doctorId, {
    isConnected: true,
    accessToken: token,
    expiresAt,
    userEmail,
    userName,
    userAvatar,
    spreadsheetId,
    spreadsheetUrl,
    driveFolderId: folderId,
    driveFolderUrl: folderUrl,
  });

  isSigningIn = false;

  return {
    accessToken: token,
    spreadsheetId,
    spreadsheetUrl,
    folderId,
    folderUrl,
    userEmail,
  };
}

export function requestGoogleAccessToken(
  onSuccess: (token: string, expiresIn: number, email?: string) => void,
  onError?: (err: any) => void
): void {
  requestGisAccessToken()
    .then(async (gisRes) => {
      cachedAccessToken = gisRes.accessToken;
      const profile = await fetchGoogleUserProfile(gisRes.accessToken);
      onSuccess(gisRes.accessToken, gisRes.expiresIn, profile.email);
    })
    .catch((err) => {
      if (onError) onError(err);
    });
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ==========================================
// GOOGLE SHEETS API
// ==========================================

export const TAB_CONFIGS: Record<FormType, { name: string; headers: string[] }> = {
  adult: {
    name: 'Adult CPB',
    headers: [
      'Patient ID',
      'Patient Name',
      'Status',
      'Drive PDF (Click to Download)',
      'Date',
      'Age',
      'Sex',
      'IP No',
      'Bed No',
      'Diagnosis',
      'Surgery',
      'Surgeon',
      'Anaesthetist',
      'Perfusionist',
      'BSA (m²)',
      'Flow 3.0 LPM',
      'Flow 2.4 LPM',
      'Oxygenator',
      'CPB On',
      'CPB Off',
      'ACC On',
      'ACC Off',
      'Total Prime Gain (mL)',
      'Total Fluid Loss (mL)',
      'Net Balance (mL)',
      'Heparin Dose',
      'ACT Value',
      'Remarks',
      'Drive File ID',
      'Google Drive PDF URL',
      'Form Data (JSON)',
      'Last Updated',
    ],
  },
  pediatric: {
    name: 'Pediatric CPB',
    headers: [
      'Patient ID',
      'Patient Name',
      'Status',
      'Drive PDF (Click to Download)',
      'Date',
      'Age',
      'Sex',
      'IP No',
      'Bed No',
      'Diagnosis',
      'Surgery',
      'Surgeon',
      'Anaesthetist',
      'Perfusionist',
      'BSA (m²)',
      'Flow 3.0 LPM',
      'Flow 2.4 LPM',
      'Oxygenator',
      'CPB On',
      'CPB Off',
      'ACC On',
      'ACC Off',
      'Total Prime Gain (mL)',
      'Total Fluid Loss (mL)',
      'Net Balance (mL)',
      'Heparin Dose',
      'ACT Value',
      'Remarks',
      'Drive File ID',
      'Google Drive PDF URL',
      'Form Data (JSON)',
      'Last Updated',
    ],
  },
  ecmo: {
    name: 'ECMO Records',
    headers: [
      'Patient ID',
      'Patient Name',
      'Status',
      'Drive PDF (Click to Download)',
      'Date',
      'Age',
      'Sex',
      'IP No',
      'ECMO Mode',
      'Diagnosis',
      'Surgery',
      'Surgeon',
      'Perfusionist',
      'ECMO Kit',
      'ECMO Console',
      'ECMO On',
      'ECMO Off',
      'Prime Gain (mL)',
      'Fluid Loss (mL)',
      'Balance (mL)',
      'Remarks',
      'Drive File ID',
      'Google Drive PDF URL',
      'Form Data (JSON)',
      'Last Updated',
    ],
  },
  iabp: {
    name: 'IABP Records',
    headers: [
      'Patient ID',
      'Patient Name',
      'Status',
      'Drive PDF (Click to Download)',
      'Date',
      'Age',
      'Sex',
      'IP No',
      'Bed No',
      'Diagnosis',
      'Surgery',
      'Surgeon',
      'Perfusionist',
      'Balloon Size',
      'Nor-Adrenaline',
      'Adrenaline',
      'NTG',
      'Dobutamine',
      'Remarks',
      'Drive File ID',
      'Google Drive PDF URL',
      'Form Data (JSON)',
      'Last Updated',
    ],
  },
};

export async function createOrGetSpreadsheet(
  token: string,
  doctorName: string,
  existingSpreadsheetId?: string | null
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  if (existingSpreadsheetId && !existingSpreadsheetId.startsWith('1MF')) {
    return {
      spreadsheetId: existingSpreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${existingSpreadsheetId}/edit`,
    };
  }

  const title = `MedForms Pro - Clinical Perfusion Registry (${doctorName})`;
  const sheets = [
    { properties: { title: 'Adult CPB' } },
    { properties: { title: 'Pediatric CPB' } },
    { properties: { title: 'ECMO Records' } },
    { properties: { title: 'IABP Records' } },
  ];

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      properties: { title },
      sheets,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Sheets API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
  };
}

export function recordToRowValues(rec: PatientRecord, formType: FormType): string[] {
  const d = rec.data as any;
  const drivePdfFormula = rec.drivePdfUrl
    ? `=HYPERLINK("${rec.drivePdfUrl}", "📥 Open / Download PDF (${rec.patientId})")`
    : 'Pending Drive Upload';
  const drivePdfDirectUrl = rec.drivePdfUrl || '';
  const driveFileId = rec.driveFileId || '';
  const formDataJson = rec.data ? JSON.stringify(rec.data) : '{}';

  const common = [
    rec.patientId,
    rec.patientName || '',
    rec.status.toUpperCase(),
    drivePdfFormula,
    d.date || '',
    d.age || '',
    d.sex || '',
    d.ipNo || '',
    d.bedNo || '',
    d.diagnosis || '',
    d.surgery || '',
    d.surgeon || '',
    d.anaesthetist || '',
    d.perfusionist || '',
    d.bsa || '',
    d.flowRate30 || d.flow30 || '',
    d.flowRate24 || d.flow24 || '',
    d.oxygenator || '',
    d.cpbOn || '',
    d.cpbOff || '',
    d.accOn || '',
    d.accOff || d.acOff || '',
    d.primeGain?.totalGain || '0',
    d.fluidLoss?.totalLoss || '0',
    d.fluidLoss?.balance || '0',
    d.heparinDose || d.hepDose || '',
    d.actValue || '',
    d.remarks || '',
    driveFileId,
    drivePdfDirectUrl,
    formDataJson,
    rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : '',
  ];

  if (formType === 'adult' || formType === 'pediatric') {
    return common;
  } else if (formType === 'ecmo') {
    return [
      rec.patientId,
      rec.patientName || '',
      rec.status.toUpperCase(),
      drivePdfFormula,
      d.date || '',
      d.age || '',
      d.sex || '',
      d.ipNo || '',
      d.ecmoMode || 'VA',
      d.diagnosis || '',
      d.surgery || '',
      d.surgeon || '',
      d.perfusionist || '',
      d.ecmoKit || '',
      d.ecmoConsole || '',
      d.ecmoOn || '',
      d.ecmoOff || '',
      d.primeGain?.totalGain || '0',
      d.fluidLoss?.totalLoss || '0',
      d.fluidLoss?.balance || '0',
      d.remarks || '',
      driveFileId,
      drivePdfDirectUrl,
      formDataJson,
      rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : '',
    ];
  } else {
    // IABP
    return [
      rec.patientId,
      rec.patientName || '',
      rec.status.toUpperCase(),
      drivePdfFormula,
      d.date || '',
      d.age || '',
      d.sex || '',
      d.ipNo || '',
      d.bedNo || '',
      d.diagnosis || '',
      d.surgery || '',
      d.surgeon || '',
      d.perfusionist || '',
      d.balloonSize || '',
      d.supports?.norAdrenaline || '',
      d.supports?.adrenaline || '',
      d.supports?.ntg || '',
      d.supports?.dobutamine || '',
      d.remarks || '',
      driveFileId,
      drivePdfDirectUrl,
      formDataJson,
      rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : '',
    ];
  }
}

export async function syncTabRecordsToGoogleSheets(
  token: string,
  spreadsheetId: string,
  formType: FormType,
  records: PatientRecord[]
): Promise<{ success: boolean; rowsSynced: number }> {
  const conf = TAB_CONFIGS[formType];
  const tabName = conf.name;
  const filtered = records.filter((r) => r.formType === formType);

  const rows = [conf.headers, ...filtered.map((r) => recordToRowValues(r, formType))];

  const range = `'${tabName}'!A1:AE${rows.length + 10}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to sync ${tabName} to Google Sheets: ${errText}`);
  }

  return { success: true, rowsSynced: filtered.length };
}

export async function syncAllRecordsToGoogleSheets(
  token: string,
  spreadsheetId: string,
  records: PatientRecord[]
): Promise<{ success: boolean; summary: Record<FormType, number>; total: number }> {
  const types: FormType[] = ['adult', 'pediatric', 'ecmo', 'iabp'];
  const summary: Record<FormType, number> = {
    adult: 0,
    pediatric: 0,
    ecmo: 0,
    iabp: 0,
  };

  let total = 0;
  for (const ft of types) {
    const res = await syncTabRecordsToGoogleSheets(token, spreadsheetId, ft, records);
    summary[ft] = res.rowsSynced;
    total += res.rowsSynced;
  }

  saveGoogleAuth({
    lastSyncedAt: new Date().toISOString(),
  });

  return { success: true, summary, total };
}

// ==========================================
// GOOGLE DRIVE API
// ==========================================

export async function createOrGetDriveFolder(
  token: string,
  folderName: string = 'MedForms Pro Clinical Vault',
  existingFolderId?: string | null
): Promise<{ folderId: string; folderUrl: string }> {
  if (existingFolderId && !existingFolderId.startsWith('1DRV_')) {
    return {
      folderId: existingFolderId,
      folderUrl: `https://drive.google.com/drive/folders/${existingFolderId}`,
    };
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive API Error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    folderId: data.id,
    folderUrl: `https://drive.google.com/drive/folders/${data.id}`,
  };
}

/**
 * Robust RFC Multipart/Related PDF uploader to Google Drive v3 API
 */
export async function uploadPdfToDrive(
  token: string,
  folderId: string,
  fileName: string,
  pdfBlob: Blob
): Promise<{ fileId: string; viewUrl: string; name: string }> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    mimeType: 'application/pdf',
  };

  // Convert Blob to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/pdf\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive PDF upload failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    viewUrl: `https://drive.google.com/file/d/${data.id}/view`,
    name: fileName,
  };
}

/**
 * Robust RFC Multipart/Related Standalone HTML uploader to Google Drive v3 API
 * This archives the exact, interactive, populated HTML medical form to Google Drive
 */
export async function uploadHtmlToDrive(
  token: string,
  folderId: string,
  fileName: string,
  htmlContent: string
): Promise<{ fileId: string; viewUrl: string; name: string }> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    mimeType: 'text/html',
  };

  const utf8Bytes = new TextEncoder().encode(htmlContent);
  let binary = '';
  const len = utf8Bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64Data = btoa(binary);

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html; charset=UTF-8\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive HTML upload failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    fileId: data.id,
    viewUrl: `https://drive.google.com/file/d/${data.id}/view`,
    name: fileName,
  };
}

