import {
  DoctorProfile,
  PatientRecord,
  FormType,
  AnyClinicalFormData,
  AdultFormData,
  PediatricFormData,
  EcmoFormData,
  IabpFormData,
  FormTypeConfig,
} from '../types';
import { generatePatientId } from './calculator';
import { syncRecordToSupabase, deleteRecordFromSupabase } from './supabaseClient';

export const FORM_CONFIGS: Record<FormType, FormTypeConfig> = {
  adult: {
    id: 'adult',
    title: 'Adult Data Sheet',
    shortTitle: 'Adult',
    description: 'Adult cardiac surgery perfusion & blood gas monitoring sheet.',
    sheetTabName: 'Adult_Records',
    badgeColor: 'blue',
    iconName: 'FileText',
  },
  pediatric: {
    id: 'pediatric',
    title: 'Pediatric Data Sheet',
    shortTitle: 'Pediatric',
    description: 'Pediatric cardiac surgery perfusion & blood gas monitoring sheet.',
    sheetTabName: 'Pediatric_Records',
    badgeColor: 'emerald',
    iconName: 'HeartPulse',
  },
  ecmo: {
    id: 'ecmo',
    title: 'ECMO Data Sheet',
    shortTitle: 'ECMO',
    description: 'Extracorporeal Membrane Oxygenation sheet (VA / VV / VAV / VVA).',
    sheetTabName: 'ECMO_Records',
    badgeColor: 'purple',
    iconName: 'Activity',
  },
  iabp: {
    id: 'iabp',
    title: 'IABP Data Sheet',
    shortTitle: 'IABP',
    description: 'Intra-Aortic Balloon Pump hemodynamic tracking & support sheet.',
    sheetTabName: 'IABP_Records',
    badgeColor: 'amber',
    iconName: 'ShieldAlert',
  },
};

export const DEFAULT_DOCTORS: DoctorProfile[] = [];

export function createBlankFormData(formType: FormType, patientName = ''): AnyClinicalFormData {
  const baseData = {
    patientName: patientName,
    age: '',
    sex: '' as const,
    ipNo: '',
    bedNo: '',
    conDr: '',
    height: '',
    weight: '',
    bsa: '',
    flow30: '',
    flow24: '',
    diagnosis: '',
    surgery: '',
    date: new Date().toISOString().split('T')[0],
    otLpm: '',
    surgeon: '',
    anaesthesist: '',
    perfusionist: '',
    bloodGroup: '',
    preHb: '',
    circHb: '',
    hepTime: '',
    hepDose: '',
    actTime: '',
    actValue: '',
    remarks: '',
    creat: '',
    ef: '',
    dm: false,
    htn: false,
    ckd: false,
    primeGain: {
      plasmalyteBefore: '',
      plasmalyteDuring: '',
      albuminBefore: '',
      albuminDuring: '',
      bicarbBefore: '',
      bicarbDuring: '',
      mannitolBefore: '',
      mannitolDuring: '',
      bloodBefore: '',
      bloodDuring: '',
      totalPrimeBefore: '',
      totalPrimeDuring: '',
      totalGain: '',
    },
    fluidLoss: {
      postPerfVol: '',
      orLossSponges: '',
      urine: '',
      others: '',
      cufMuf: '',
      totalLoss: '',
      balance: '',
    },
  };

  if (formType === 'adult' || formType === 'pediatric') {
    const bloodGasRows = [
      { id: '1', label: 'PRE', time: '', temp: '', bFlow: '', lp: '', map: '', gasFlow: '', fio2: '', hb: '', ph: '', pco2: '', po2: '', hco3: '', be: '', oPercent: '', na: '', k: '', hct: '' },
      { id: '2', label: 'ON', time: '', temp: '', bFlow: '', lp: '', map: '', gasFlow: '', fio2: '', hb: '', ph: '', pco2: '', po2: '', hco3: '', be: '', oPercent: '', na: '', k: '', hct: '' },
      { id: '3', label: '', time: '', temp: '', bFlow: '', lp: '', map: '', gasFlow: '', fio2: '', hb: '', ph: '', pco2: '', po2: '', hco3: '', be: '', oPercent: '', na: '', k: '', hct: '' },
      { id: '4', label: '', time: '', temp: '', bFlow: '', lp: '', map: '', gasFlow: '', fio2: '', hb: '', ph: '', pco2: '', po2: '', hco3: '', be: '', oPercent: '', na: '', k: '', hct: '' },
      { id: '5', label: '', time: '', temp: '', bFlow: '', lp: '', map: '', gasFlow: '', fio2: '', hb: '', ph: '', pco2: '', po2: '', hco3: '', be: '', oPercent: '', na: '', k: '', hct: '' },
      { id: '6', label: '', time: '', temp: '', bFlow: '', lp: '', map: '', gasFlow: '', fio2: '', hb: '', ph: '', pco2: '', po2: '', hco3: '', be: '', oPercent: '', na: '', k: '', hct: '' },
    ];

    const specificData: AdultFormData = {
      ...baseData,
      oxygenator: '',
      cpds: '',
      cannulasAortic: '',
      cannulasSvc: '',
      cannulasIvc: '',
      tubingsAv: '',
      hemofilter: '',
      cpbOn: '',
      cpbOff: '',
      accOn: '',
      acOff: '',
      bsTime: '',
      bsValue: '',
      cardioplegia: {
        type: 'delnido',
        total: '',
        times: ['', '', '', '', '', '', ''],
        doses: ['', '', '', '', '', '', ''],
      },
      bloodGasRows,
    };
    return specificData;
  }

  if (formType === 'ecmo') {
    const ecmoRows = [
      { id: '1', sNo: '1', time: '', bp: '', spo2: '', pr: '', map: '', lp: '', p1: '', p2: '', deltaP: '', flow: '', fio2: '', temp: '' },
      { id: '2', sNo: '2', time: '', bp: '', spo2: '', pr: '', map: '', lp: '', p1: '', p2: '', deltaP: '', flow: '', fio2: '', temp: '' },
      { id: '3', sNo: '3', time: '', bp: '', spo2: '', pr: '', map: '', lp: '', p1: '', p2: '', deltaP: '', flow: '', fio2: '', temp: '' },
      { id: '4', sNo: '4', time: '', bp: '', spo2: '', pr: '', map: '', lp: '', p1: '', p2: '', deltaP: '', flow: '', fio2: '', temp: '' },
      { id: '5', sNo: '5', time: '', bp: '', spo2: '', pr: '', map: '', lp: '', p1: '', p2: '', deltaP: '', flow: '', fio2: '', temp: '' },
    ];

    const specificData: EcmoFormData = {
      ...baseData,
      ecmoMode: 'VA',
      ecmoKit: '',
      ecmoConsole: '',
      cannulasAortic: '',
      cannulasSvc: '',
      cannulasIvc: '',
      tubingsAv: '',
      hemofilter: '',
      ecmoOn: '',
      ecmoOff: '',
      ecmoRows,
    };
    return specificData;
  }

  // IABP
  const iabpRows = [
    { id: '1', sNo: '1', time: '', trigger: '', ratio: '', augPressure: '', augLvl: '', sp: '', dp: '', mean: '' },
    { id: '2', sNo: '2', time: '', trigger: '', ratio: '', augPressure: '', augLvl: '', sp: '', dp: '', mean: '' },
    { id: '3', sNo: '3', time: '', trigger: '', ratio: '', augPressure: '', augLvl: '', sp: '', dp: '', mean: '' },
    { id: '4', sNo: '4', time: '', trigger: '', ratio: '', augPressure: '', augLvl: '', sp: '', dp: '', mean: '' },
  ];

  const labRows = [
    { sNo: '1', wbc: '', pc: '' },
    { sNo: '2', wbc: '', pc: '' },
    { sNo: '3', wbc: '', pc: '' },
    { sNo: '4', wbc: '', pc: '' },
  ];

  const specificData: IabpFormData = {
    ...baseData,
    balloonSize: '',
    supports: {
      norAdrenaline: '',
      adrenaline: '',
      ntg: '',
      dobutamine: '',
    },
    iabpRows,
    labRows,
  };
  return specificData;
}

/**
 * Single Source of Truth for collecting form data:
 * Ensures all fields exist with full structural fidelity, defaults, and clean strings.
 * Preserves empty fields as empty strings instead of discarding or making them undefined.
 */
export function collectFormData(formType: FormType, rawData: any): AnyClinicalFormData {
  const blank = createBlankFormData(formType, rawData?.patientName || '');
  if (!rawData || typeof rawData !== 'object') {
    return blank;
  }

  const vStr = (val: any, fallback = '') => (val !== undefined && val !== null ? String(val) : fallback);

  const mergedBase = {
    patientName: vStr(rawData.patientName, blank.patientName),
    age: vStr(rawData.age),
    sex: (rawData.sex || '') as any,
    ipNo: vStr(rawData.ipNo),
    bedNo: vStr(rawData.bedNo),
    conDr: vStr(rawData.conDr),
    height: vStr(rawData.height),
    weight: vStr(rawData.weight),
    bsa: vStr(rawData.bsa),
    flow30: vStr(rawData.flow30),
    flow24: vStr(rawData.flow24),
    diagnosis: vStr(rawData.diagnosis),
    surgery: vStr(rawData.surgery),
    date: vStr(rawData.date, blank.date),
    otLpm: vStr(rawData.otLpm),
    surgeon: vStr(rawData.surgeon),
    anaesthesist: vStr(rawData.anaesthesist || rawData.anaesthetist),
    perfusionist: vStr(rawData.perfusionist),
    bloodGroup: vStr(rawData.bloodGroup),
    preHb: vStr(rawData.preHb),
    circHb: vStr(rawData.circHb),
    hepTime: vStr(rawData.hepTime),
    hepDose: vStr(rawData.hepDose || rawData.heparinDose),
    actTime: vStr(rawData.actTime),
    actValue: vStr(rawData.actValue),
    remarks: vStr(rawData.remarks),
    creat: vStr(rawData.creat),
    ef: vStr(rawData.ef),
    dm: Boolean(rawData.dm),
    htn: Boolean(rawData.htn),
    ckd: Boolean(rawData.ckd),
    primeGain: {
      plasmalyteBefore: vStr(rawData.primeGain?.plasmalyteBefore),
      plasmalyteDuring: vStr(rawData.primeGain?.plasmalyteDuring),
      albuminBefore: vStr(rawData.primeGain?.albuminBefore),
      albuminDuring: vStr(rawData.primeGain?.albuminDuring),
      bicarbBefore: vStr(rawData.primeGain?.bicarbBefore),
      bicarbDuring: vStr(rawData.primeGain?.bicarbDuring),
      mannitolBefore: vStr(rawData.primeGain?.mannitolBefore),
      mannitolDuring: vStr(rawData.primeGain?.mannitolDuring),
      bloodBefore: vStr(rawData.primeGain?.bloodBefore),
      bloodDuring: vStr(rawData.primeGain?.bloodDuring),
      totalPrimeBefore: vStr(rawData.primeGain?.totalPrimeBefore),
      totalPrimeDuring: vStr(rawData.primeGain?.totalPrimeDuring),
      totalGain: vStr(rawData.primeGain?.totalGain),
    },
    fluidLoss: {
      postPerfVol: vStr(rawData.fluidLoss?.postPerfVol),
      orLossSponges: vStr(rawData.fluidLoss?.orLossSponges),
      urine: vStr(rawData.fluidLoss?.urine),
      others: vStr(rawData.fluidLoss?.others),
      cufMuf: vStr(rawData.fluidLoss?.cufMuf),
      totalLoss: vStr(rawData.fluidLoss?.totalLoss),
      balance: vStr(rawData.fluidLoss?.balance),
    },
  };

  if (formType === 'adult' || formType === 'pediatric') {
    const rawBloodGas = Array.isArray(rawData.bloodGasRows) && rawData.bloodGasRows.length > 0
      ? rawData.bloodGasRows
      : (blank as AdultFormData).bloodGasRows;

    const bloodGasRows = rawBloodGas.map((r: any, idx: number) => ({
      id: vStr(r.id, String(idx + 1)),
      label: vStr(r.label, idx === 0 ? 'PRE' : idx === 1 ? 'ON' : ''),
      time: vStr(r.time),
      temp: vStr(r.temp),
      bFlow: vStr(r.bFlow),
      lp: vStr(r.lp),
      map: vStr(r.map),
      gasFlow: vStr(r.gasFlow),
      fio2: vStr(r.fio2),
      hb: vStr(r.hb),
      ph: vStr(r.ph),
      pco2: vStr(r.pco2),
      po2: vStr(r.po2),
      hco3: vStr(r.hco3),
      be: vStr(r.be),
      oPercent: vStr(r.oPercent),
      na: vStr(r.na),
      k: vStr(r.k),
      hct: vStr(r.hct),
    }));

    return {
      ...mergedBase,
      oxygenator: vStr(rawData.oxygenator),
      cpds: vStr(rawData.cpds),
      cannulasAortic: vStr(rawData.cannulasAortic),
      cannulasSvc: vStr(rawData.cannulasSvc),
      cannulasIvc: vStr(rawData.cannulasIvc),
      tubingsAv: vStr(rawData.tubingsAv),
      hemofilter: vStr(rawData.hemofilter),
      cpbOn: vStr(rawData.cpbOn),
      cpbOff: vStr(rawData.cpbOff),
      accOn: vStr(rawData.accOn),
      acOff: vStr(rawData.acOff),
      bsTime: vStr(rawData.bsTime),
      bsValue: vStr(rawData.bsValue),
      cardioplegia: {
        type: rawData.cardioplegia?.type || 'delnido',
        total: vStr(rawData.cardioplegia?.total),
        times: Array.isArray(rawData.cardioplegia?.times)
          ? rawData.cardioplegia.times.map((t: any) => vStr(t))
          : ['', '', '', '', '', '', ''],
        doses: Array.isArray(rawData.cardioplegia?.doses)
          ? rawData.cardioplegia.doses.map((d: any) => vStr(d))
          : ['', '', '', '', '', '', ''],
      },
      bloodGasRows,
    } as AdultFormData;
  }

  if (formType === 'ecmo') {
    const rawEcmoRows = Array.isArray(rawData.ecmoRows) && rawData.ecmoRows.length > 0
      ? rawData.ecmoRows
      : (blank as EcmoFormData).ecmoRows;

    const ecmoRows = rawEcmoRows.map((r: any, idx: number) => ({
      id: vStr(r.id, String(idx + 1)),
      sNo: vStr(r.sNo, String(idx + 1)),
      time: vStr(r.time),
      bp: vStr(r.bp),
      spo2: vStr(r.spo2),
      pr: vStr(r.pr),
      map: vStr(r.map),
      lp: vStr(r.lp),
      p1: vStr(r.p1),
      p2: vStr(r.p2),
      deltaP: vStr(r.deltaP),
      flow: vStr(r.flow),
      fio2: vStr(r.fio2),
      temp: vStr(r.temp),
    }));

    return {
      ...mergedBase,
      ecmoMode: (rawData.ecmoMode || 'VA') as any,
      ecmoKit: vStr(rawData.ecmoKit),
      ecmoConsole: vStr(rawData.ecmoConsole),
      cannulasAortic: vStr(rawData.cannulasAortic),
      cannulasSvc: vStr(rawData.cannulasSvc),
      cannulasIvc: vStr(rawData.cannulasIvc),
      tubingsAv: vStr(rawData.tubingsAv),
      hemofilter: vStr(rawData.hemofilter),
      ecmoOn: vStr(rawData.ecmoOn),
      ecmoOff: vStr(rawData.ecmoOff),
      ecmoRows,
    } as EcmoFormData;
  }

  // IABP
  const rawIabpRows = Array.isArray(rawData.iabpRows) && rawData.iabpRows.length > 0
    ? rawData.iabpRows
    : (blank as IabpFormData).iabpRows;

  const iabpRows = rawIabpRows.map((r: any, idx: number) => ({
    id: vStr(r.id, String(idx + 1)),
    sNo: vStr(r.sNo, String(idx + 1)),
    time: vStr(r.time),
    trigger: vStr(r.trigger),
    ratio: vStr(r.ratio),
    augPressure: vStr(r.augPressure),
    augLvl: vStr(r.augLvl),
    sp: vStr(r.sp),
    dp: vStr(r.dp),
    mean: vStr(r.mean),
  }));

  const rawLabRows = Array.isArray(rawData.labRows) && rawData.labRows.length > 0
    ? rawData.labRows
    : (blank as IabpFormData).labRows;

  const labRows = rawLabRows.map((r: any, idx: number) => ({
    sNo: vStr(r.sNo, String(idx + 1)),
    wbc: vStr(r.wbc),
    pc: vStr(r.pc),
  }));

  return {
    ...mergedBase,
    balloonSize: vStr(rawData.balloonSize),
    supports: {
      norAdrenaline: vStr(rawData.supports?.norAdrenaline),
      adrenaline: vStr(rawData.supports?.adrenaline),
      ntg: vStr(rawData.supports?.ntg),
      dobutamine: vStr(rawData.supports?.dobutamine),
    },
    iabpRows,
    labRows,
  } as IabpFormData;
}

export function getBaselineReferenceRecords(): PatientRecord[] {
  return [];
}

const STORAGE_KEY_RECORDS = 'medforms_patient_records_v3';
const STORAGE_KEY_DOCTORS = 'medforms_registered_doctors_v3';
const STORAGE_KEY_AUTH_SESSION = 'medforms_auth_session_doctor_id';

const inMemoryStorage: Record<string, string> = {};

function safeStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {}
  return inMemoryStorage[key] || null;
}

function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
  inMemoryStorage[key] = value;
}

function safeStorageRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {}
  delete inMemoryStorage[key];
}

export function getStoredDoctors(): DoctorProfile[] {
  try {
    const raw = safeStorageGet(STORAGE_KEY_DOCTORS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredDoctor(doctor: DoctorProfile): void {
  try {
    const doctors = getStoredDoctors();
    const idx = doctors.findIndex((d) => d.id === doctor.id || d.email.toLowerCase() === doctor.email.toLowerCase());
    if (idx >= 0) {
      doctors[idx] = { ...doctors[idx], ...doctor };
    } else {
      doctors.push(doctor);
    }
    safeStorageSet(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  } catch (e) {
    console.warn('saveStoredDoctor note:', e);
  }
}


export function updateDoctorProfile(doctorId: string, updates: Partial<DoctorProfile>): DoctorProfile {
  const doctors = getStoredDoctors();
  const idx = doctors.findIndex((d) => d.id === doctorId);
  if (idx >= 0) {
    doctors[idx] = { ...doctors[idx], ...updates };
    safeStorageSet(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
    return doctors[idx];
  }
  const current = getCurrentDoctor();
  const updated = { ...current, ...updates };
  saveStoredDoctor(updated);
  return updated;
}

export function findDoctorByEmail(email: string): DoctorProfile | null {
  const doctors = getStoredDoctors();
  const found = doctors.find((d) => d.email.toLowerCase().trim() === email.toLowerCase().trim());
  return found || null;
}

export function findDoctorByUsernameOrEmail(identifier: string): DoctorProfile | null {
  const doctors = getStoredDoctors();
  const clean = identifier.toLowerCase().trim();
  const found = doctors.find(
    (d) =>
      d.email.toLowerCase().trim() === clean ||
      (d.username && d.username.toLowerCase().trim() === clean)
  );
  return found || null;
}

export function registerDoctorAccount(profile: {
  name: string;
  email: string;
  username?: string;
  password?: string;
  hospital?: string;
  department?: string;
  role?: string;
}): DoctorProfile {
  const doctors = getStoredDoctors();
  const cleanEmail = profile.email.toLowerCase().trim();
  const cleanUsername = profile.username ? profile.username.toLowerCase().trim() : cleanEmail.split('@')[0];

  const existingIdx = doctors.findIndex(
    (d) => d.email.toLowerCase().trim() === cleanEmail || (d.username && d.username.toLowerCase().trim() === cleanUsername)
  );

  const newDoc: DoctorProfile = {
    id: existingIdx >= 0 ? doctors[existingIdx].id : `UUID-DOC-${Date.now().toString(36).toUpperCase()}`,
    name: profile.name.trim() || 'Dr. Practitioner',
    email: cleanEmail,
    username: cleanUsername,
    passwordHash: profile.password ? btoa(profile.password) : undefined,
    authProvider: 'email',
    role: profile.role || 'Consultant Cardiac Surgeon & Perfusionist',
    hospital: profile.hospital?.trim() || 'Apex Heart & Lung Institute',
    department: profile.department || 'Cardiothoracic Surgery & Perfusion',
  };

  if (existingIdx >= 0) {
    doctors[existingIdx] = { ...doctors[existingIdx], ...newDoc };
  } else {
    doctors.push(newDoc);
  }

  safeStorageSet(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  return newDoc;
}

export function signInDoctorWithGoogle(
  googleEmail: string,
  googleName?: string,
  googleAvatar?: string
): DoctorProfile {
  const doctors = getStoredDoctors();
  const cleanEmail = googleEmail.toLowerCase().trim();
  const existing = doctors.find((d) => d.email.toLowerCase().trim() === cleanEmail);

  if (existing) {
    if (googleName && (!existing.name || existing.name === 'Dr. Practitioner')) {
      existing.name = googleName.startsWith('Dr.') ? googleName : `Dr. ${googleName}`;
      safeStorageSet(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
    }
    return existing;
  }

  const nameParts = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
  const formattedName = googleName
    ? (googleName.startsWith('Dr.') ? googleName : `Dr. ${googleName}`)
    : `Dr. ${nameParts.charAt(0).toUpperCase() + nameParts.slice(1)}`;

  const newDoc: DoctorProfile = {
    id: `UUID-GOOG-${Date.now().toString(36).toUpperCase()}`,
    name: formattedName,
    email: cleanEmail,
    username: cleanEmail.split('@')[0],
    authProvider: 'google',
    role: 'Consultant Cardiac Surgeon & Perfusionist',
    hospital: 'Apex Heart & Lung Institute',
    department: 'Cardiothoracic Surgery & Perfusion',
  };

  doctors.push(newDoc);
  safeStorageSet(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  return newDoc;
}

export function clearAllPatientRecords(): void {
  try {
    safeStorageRemove(STORAGE_KEY_RECORDS);
    safeStorageSet(STORAGE_KEY_RECORDS, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to clear records', err);
  }
}

export function getStoredRecords(): PatientRecord[] {
  try {
    const raw = safeStorageGet(STORAGE_KEY_RECORDS);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredRecords(records: PatientRecord[]): void {
  try {
    safeStorageSet(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to write to safeStorage', err);
  }
}

export function getActiveSessionDoctorId(): string | null {
  try {
    return safeStorageGet(STORAGE_KEY_AUTH_SESSION);
  } catch {
    return null;
  }
}

export function setActiveSessionDoctorId(doctorId: string | null): void {
  try {
    if (doctorId) {
      safeStorageSet(STORAGE_KEY_AUTH_SESSION, doctorId);
    } else {
      safeStorageRemove(STORAGE_KEY_AUTH_SESSION);
    }
  } catch {}
}

export function getCurrentDoctor(): DoctorProfile | null {
  const doctors = getStoredDoctors();
  const sessionDocId = getActiveSessionDoctorId();
  if (sessionDocId) {
    const found = doctors.find((d) => d.id === sessionDocId);
    if (found) return found;
  }
  return null;
}

export function setCurrentDoctor(doctor: DoctorProfile | null): void {
  if (doctor) {
    saveStoredDoctor(doctor);
    setActiveSessionDoctorId(doctor.id);
  } else {
    setActiveSessionDoctorId(null);
  }
}

/**
 * Hashes a 4-digit PIN using SHA-256 (secure, irreversible, stored never as plain text)
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`medforms_pin_salt_${pin}_v1`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Registers a new practitioner with a name and optional 4-digit PIN.
 * PIN is hashed with SHA-256 before storage. Developer cannot read it.
 */
export async function registerDoctorWithPin(profile: {
  name: string;
  hospital?: string;
  department?: string;
  role?: string;
  pin?: string;
}): Promise<DoctorProfile> {
  const doctors = getStoredDoctors();
  const cleanName = profile.name.trim() || 'Dr. Practitioner';
  const formattedName = cleanName.startsWith('Dr.') ? cleanName : `Dr. ${cleanName}`;

  const pinHash = profile.pin && profile.pin.length === 4
    ? await hashPin(profile.pin)
    : undefined;

  const newDoc: DoctorProfile = {
    id: `DOC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: formattedName,
    email: `${formattedName.toLowerCase().replace(/[^a-z0-9]/g, '_')}@medforms.local`,
    username: formattedName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    passwordHash: pinHash,
    authProvider: 'pin',
    role: profile.role || 'Consultant Cardiac Surgeon & Perfusionist',
    hospital: profile.hospital?.trim() || 'Apex Heart & Lung Institute',
    department: profile.department || 'Cardiothoracic Surgery & Perfusion',
  };

  doctors.push(newDoc);
  safeStorageSet(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  return newDoc;
}

/**
 * Signs in with a PIN. Returns the doctor if PIN matches or if no PIN is set (guest mode).
 */
export async function signInDoctorWithPin(
  doctorId: string,
  pin?: string
): Promise<{ success: boolean; doctor?: DoctorProfile; error?: string }> {
  const doctors = getStoredDoctors();
  const doctor = doctors.find((d) => d.id === doctorId);

  if (!doctor) {
    return { success: false, error: 'Account not found.' };
  }

  // No PIN set — guest access (tap to enter)
  if (!doctor.passwordHash) {
    return { success: true, doctor };
  }

  // PIN required
  if (!pin) {
    return { success: false, error: 'PIN required' };
  }

  const inputHash = await hashPin(pin);
  if (inputHash === doctor.passwordHash) {
    return { success: true, doctor };
  }

  return { success: false, error: 'Incorrect PIN. Please try again.' };
}

/**
 * Gets all registered practitioners for the profile picker screen
 */
export function getAllPractitioners(): DoctorProfile[] {
  return getStoredDoctors();
}

/**
 * Checks if a practitioner requires a PIN (returns true) or allows guest tap-to-enter (returns false)
 */
export function practitionerHasPin(doctorId: string): boolean {
  const doctors = getStoredDoctors();
  const doc = doctors.find((d) => d.id === doctorId);
  return !!doc?.passwordHash;
}

/**
 * Updates (sets or clears) a practitioner's PIN
 */
export async function updateDoctorPin(doctorId: string, newPin?: string): Promise<boolean> {
  const doctors = getStoredDoctors();
  const idx = doctors.findIndex((d) => d.id === doctorId);
  if (idx < 0) return false;

  doctors[idx].passwordHash = newPin && newPin.length === 4
    ? await hashPin(newPin)
    : undefined;

  safeStorageSet(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
  return true;
}


/**
 * Strict RLS Query: Only returns records belonging to the authenticated doctor
 */
export function getDoctorRecords(doctorId: string, formType?: FormType): PatientRecord[] {
  const all = getStoredRecords();
  return all.filter((r) => {
    const matchesDoctor = r.doctorId === doctorId;
    if (!matchesDoctor) return false;
    if (formType) return r.formType === formType;
    return true;
  });
}

/**
 * Strict RLS Query: Returns a single record only if doctor_id matches
 */
export function getDoctorRecordById(doctorId: string, recordId: string): PatientRecord | null {
  const all = getStoredRecords();
  const found = all.find((r) => r.id === recordId && r.doctorId === doctorId);
  return found || null;
}

/**
 * Saves (inserts or updates) a record under the doctor's partition
 */
export function saveDoctorRecord(doctorId: string, record: PatientRecord): PatientRecord {
  const all = getStoredRecords();
  const existingIdx = all.findIndex((r) => r.id === record.id);

  const cleanData = collectFormData(record.formType, record.data);
  const updatedRecord: PatientRecord = {
    ...record,
    patientName: cleanData.patientName || record.patientName,
    data: cleanData,
    doctorId, // enforce ownership
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    if (all[existingIdx].doctorId !== doctorId) {
      throw new Error('RLS Violation: You are not authorized to update another doctor’s record.');
    }
    all[existingIdx] = updatedRecord;
  } else {
    all.unshift(updatedRecord);
  }

  saveStoredRecords(all);
  // Asynchronously synchronize to Supabase cloud if active
  syncRecordToSupabase(updatedRecord).catch((e) => console.warn('Supabase auto-sync notice:', e));
  return updatedRecord;
}

/**
 * Deletes a record under the doctor's partition
 */
export function deleteDoctorRecord(doctorId: string, recordId: string): boolean {
  const all = getStoredRecords();
  const existing = all.find((r) => r.id === recordId);
  if (!existing) return false;
  if (existing.doctorId !== doctorId) {
    throw new Error('RLS Violation: You cannot delete another doctor’s record.');
  }

  const filtered = all.filter((r) => r.id !== recordId);
  saveStoredRecords(filtered);
  // Asynchronously remove from Supabase cloud if active
  deleteRecordFromSupabase(recordId).catch((e) => console.warn('Supabase auto-delete notice:', e));
  return true;
}

/**
 * Removes all records for the specified doctor (Clean Slate)
 */
export function clearDoctorRecords(doctorId: string): void {
  const all = getStoredRecords();
  const filtered = all.filter((r) => r.doctorId !== doctorId);
  saveStoredRecords(filtered);
}

/**
 * Resets doctor partition to clean state (empty records)
 */
export function resetDoctorToDefaults(doctorId: string): PatientRecord[] {
  clearDoctorRecords(doctorId);
  return [];
}


/**
 * Generates Google Sheets compatible CSV data for a specific sheet tab
 */
export function exportToGoogleSheetsCsv(records: PatientRecord[], formType: FormType): string {
  const config = FORM_CONFIGS[formType];
  const typeRecords = records.filter((r) => r.formType === formType);

  const headers = [
    'Patient ID',
    'Patient Name',
    'Status',
    'Date',
    'Age',
    'Sex',
    'IP No',
    'Bed No',
    'Consultant Dr',
    'Height (cm)',
    'Weight (kg)',
    'BSA (m2)',
    'Flow 3.0 LPM',
    'Flow 2.4 LPM',
    'Diagnosis',
    'Surgery',
    'Surgeon',
    'Anaesthesist',
    'Perfusionist',
    'Blood Group',
    'Pre Hb',
    'CIRC Hb',
    'Heparin Dose',
    'ACT Value',
    'Total Gain (ml)',
    'Total Loss (ml)',
    'Fluid Balance (ml)',
    'Remarks',
  ];

  const rows = typeRecords.map((rec) => {
    const d = rec.data;
    return [
      rec.patientId,
      `"${(rec.patientName || '').replace(/"/g, '""')}"`,
      rec.status,
      d.date || '',
      `"${d.age || ''}"`,
      d.sex || '',
      `"${d.ipNo || ''}"`,
      `"${d.bedNo || ''}"`,
      `"${(d.conDr || '').replace(/"/g, '""')}"`,
      d.height || '',
      d.weight || '',
      d.bsa || '',
      d.flow30 || '',
      d.flow24 || '',
      `"${(d.diagnosis || '').replace(/"/g, '""')}"`,
      `"${(d.surgery || '').replace(/"/g, '""')}"`,
      `"${(d.surgeon || '').replace(/"/g, '""')}"`,
      `"${(d.anaesthesist || '').replace(/"/g, '""')}"`,
      `"${(d.perfusionist || '').replace(/"/g, '""')}"`,
      d.bloodGroup || '',
      d.preHb || '',
      d.circHb || '',
      `"${d.hepDose || ''}"`,
      `"${d.actValue || ''}"`,
      d.primeGain?.totalGain || '',
      d.fluidLoss?.totalLoss || '',
      d.fluidLoss?.balance || '',
      `"${(d.remarks || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Returns aggregate stats for a doctor's records — used by DashboardView
 */
export function getDoctorStats(doctorId: string): {
  total: number;
  draft: number;
  completed: number;
  byType: { adult: number; pediatric: number; ecmo: number; iabp: number };
} {
  const records = getDoctorRecords(doctorId);
  return {
    total: records.length,
    draft: records.filter((r) => r.status === 'draft').length,
    completed: records.filter((r) => r.status === 'completed').length,
    byType: {
      adult: records.filter((r) => r.formType === 'adult').length,
      pediatric: records.filter((r) => r.formType === 'pediatric').length,
      ecmo: records.filter((r) => r.formType === 'ecmo').length,
      iabp: records.filter((r) => r.formType === 'iabp').length,
    },
  };
}
