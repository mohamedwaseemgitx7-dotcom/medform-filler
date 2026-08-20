export type FormType = 'adult' | 'pediatric' | 'ecmo' | 'iabp';

export type RecordStatus = 'draft' | 'completed';

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  passwordHash?: string;
  authProvider?: 'email' | 'google' | 'pin';

  role: string;
  hospital: string;
  department: string;
  licenseNo?: string;
  avatar?: string;
}

export interface BloodGasRow {
  id: string;
  label?: string; // 'PRE', 'ON', or timestamp
  time: string;
  temp: string;
  bFlow: string;
  lp: string;
  map: string;
  gasFlow: string;
  fio2: string;
  hb: string;
  ph: string;
  pco2: string;
  po2: string;
  hco3: string;
  be: string;
  oPercent: string;
  na: string;
  k: string;
  hct: string;
}

export interface EcmoRow {
  id: string;
  sNo: string;
  time: string;
  bp: string;
  spo2: string;
  pr: string;
  map: string;
  lp: string;
  p1: string;
  p2: string;
  deltaP: string;
  flow: string;
  fio2: string;
  temp: string;
}

export interface IabpRow {
  id: string;
  sNo: string;
  time: string;
  trigger: string;
  ratio: string;
  augPressure: string;
  augLvl: string;
  sp: string;
  dp: string;
  mean: string;
}

export interface IabpLabRow {
  sNo: string;
  wbc: string;
  pc: string;
}

export interface PrimeFluidGain {
  plasmalyteBefore: string;
  plasmalyteDuring: string;
  albuminBefore: string;
  albuminDuring: string;
  bicarbBefore: string;
  bicarbDuring: string;
  mannitolBefore: string;
  mannitolDuring: string;
  bloodBefore: string;
  bloodDuring: string;
  totalPrimeBefore: string;
  totalPrimeDuring: string;
  totalGain: string;
}

export interface FluidLoss {
  postPerfVol: string;
  orLossSponges: string;
  urine: string;
  others: string;
  cufMuf: string;
  totalLoss: string;
  balance: string;
}

export interface CardioplegiaData {
  type: 'crystalloid' | 'blood_4_1' | 'delnido' | 'custom';
  total: string;
  times: string[];
  doses: string[];
}

export interface BaseFormData {
  // Patient Details
  patientName: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other' | '';
  ipNo: string;
  bedNo: string;
  conDr: string;
  height: string; // in cm
  weight: string; // in kg
  bsa: string;    // in m2
  flow30: string; // 3.0 LPM
  flow24: string; // 2.4 LPM
  diagnosis: string;
  surgery: string;
  date: string;
  otLpm: string;

  // Clinical Team
  surgeon: string;
  anaesthesist: string;
  perfusionist: string;

  // Blood & Times
  bloodGroup: string;
  preHb: string;
  circHb: string;
  
  // Anticoagulation
  hepTime: string;
  hepDose: string;
  actTime: string;
  actValue: string;

  // Remarks & Lab
  remarks: string;
  creat: string;
  ef: string;
  dm: boolean;
  htn: boolean;
  ckd: boolean;

  // Fluid management
  primeGain: PrimeFluidGain;
  fluidLoss: FluidLoss;
}

export interface AdultFormData extends BaseFormData {
  oxygenator: string;
  cpds: string;
  cannulasAortic: string;
  cannulasSvc: string;
  cannulasIvc: string;
  tubingsAv: string;
  hemofilter: string;
  cpbOn: string;
  cpbOff: string;
  accOn: string;
  acOff: string;
  bsTime: string;
  bsValue: string;
  cardioplegia: CardioplegiaData;
  bloodGasRows: BloodGasRow[];
}

export interface PediatricFormData extends BaseFormData {
  oxygenator: string;
  cpds: string;
  cannulasAortic: string;
  cannulasSvc: string;
  cannulasIvc: string;
  tubingsAv: string;
  hemofilter: string;
  cpbOn: string;
  cpbOff: string;
  accOn: string;
  acOff: string;
  bsTime: string;
  bsValue: string;
  cardioplegia: CardioplegiaData;
  bloodGasRows: BloodGasRow[];
}

export interface EcmoFormData extends BaseFormData {
  ecmoMode: 'VA' | 'VV' | 'VAV' | 'VVA';
  ecmoKit: string;
  ecmoConsole: string;
  cannulasAortic: string;
  cannulasSvc: string;
  cannulasIvc: string;
  tubingsAv: string;
  hemofilter: string;
  ecmoOn: string;
  ecmoOff: string;
  ecmoRows: EcmoRow[];
}

export interface IabpFormData extends BaseFormData {
  balloonSize: string;
  supports: {
    norAdrenaline: string;
    adrenaline: string;
    ntg: string;
    dobutamine: string;
  };
  iabpRows: IabpRow[];
  labRows: IabpLabRow[];
}

export type AnyClinicalFormData = AdultFormData | PediatricFormData | EcmoFormData | IabpFormData;

export interface PatientRecord {
  id: string;
  doctorId: string;
  patientId: string; // e.g. "MF-7K4P9X2A"
  patientName: string;
  formType: FormType;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  data: AnyClinicalFormData;
  drivePdfUrl?: string;
  driveFileId?: string;
  lastSyncedToDriveAt?: string;
}

export interface FormTypeConfig {
  id: FormType;
  title: string;
  shortTitle: string;
  description: string;
  sheetTabName: string;
  badgeColor: string;
  iconName: string;
}
