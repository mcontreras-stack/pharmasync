import { initialDb, MockDatabase } from './initialState';
import { ClinicalHistory, NewbornRecord, NewbornScreening, NewbornVaccine, AuditLog } from '@/types/database';

const STORAGE_KEY = 'vitarahealth_mock_db';

export function getMockDb(): MockDatabase {
  if (typeof window === 'undefined') return initialDb;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDb));
    return initialDb;
  }
  try {
    const parsed = JSON.parse(stored) as MockDatabase;
    let modified = false;
    
    // Auto-merge any missing tables/arrays from initialDb into parsed database
    const keys = Object.keys(initialDb) as Array<keyof MockDatabase>;
    for (const key of keys) {
      if (!parsed[key]) {
        parsed[key] = initialDb[key] as never;
        modified = true;
      }
    }
    
    if (modified) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return initialDb;
  }
}

export function saveMockDb(db: MockDatabase) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving mockDb to localStorage:', e);
  }
}

// Existing query helpers
export function getActivePregnancy(motherId: string) {
  const db = getMockDb();
  return db.pregnancies.find(p => p.mother_id === motherId && p.status === 'active') || null;
}

export function getBabies(motherId: string) {
  const db = getMockDb();
  return db.babies.filter(b => b.mother_id === motherId);
}

export function getDoctorDetails(doctorId: string) {
  const db = getMockDb();
  return db.doctors.find(d => d.id === doctorId) || null;
}

export function getProfile(id: string) {
  const db = getMockDb();
  return db.profiles.find(p => p.id === id) || null;
}

// Production Upgrade Query Helpers
export function getClinicalHistory(motherId: string): ClinicalHistory | null {
  const db = getMockDb();
  return db.clinical_histories.find(h => h.id === motherId) || null;
}

export function saveClinicalHistory(history: ClinicalHistory) {
  const db = getMockDb();
  const index = db.clinical_histories.findIndex(h => h.id === history.id);
  if (index >= 0) {
    db.clinical_histories[index] = { ...history, updated_at: new Date().toISOString() };
  } else {
    db.clinical_histories.push({ ...history, updated_at: new Date().toISOString() });
  }
  saveMockDb(db);
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
  const db = getMockDb();
  const newLog: AuditLog = {
    ...log,
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString()
  };
  db.audit_logs = [newLog, ...db.audit_logs];
  saveMockDb(db);
}

export function verifyPrescription(code: string) {
  const db = getMockDb();
  return db.prescriptions.find(p => p.code === code || p.validation_code === code || p.uuid === code) || null;
}

export function getNewbornRecord(babyId: string): NewbornRecord | null {
  const db = getMockDb();
  return db.newborn_records.find(r => r.baby_id === babyId) || null;
}

export function saveNewbornRecord(record: NewbornRecord) {
  const db = getMockDb();
  const index = db.newborn_records.findIndex(r => r.baby_id === record.baby_id);
  if (index >= 0) {
    db.newborn_records[index] = record;
  } else {
    db.newborn_records.push(record);
  }
  saveMockDb(db);
}

export function getNewbornScreenings(newbornId: string): NewbornScreening[] {
  const db = getMockDb();
  return db.newborn_screenings.filter(s => s.newborn_id === newbornId);
}

export function addNewbornScreening(screening: Omit<NewbornScreening, 'id'>) {
  const db = getMockDb();
  const newScreening: NewbornScreening = {
    ...screening,
    id: `scr-${Date.now()}`
  };
  db.newborn_screenings.push(newScreening);
  saveMockDb(db);
}

export function getNewbornVaccines(newbornId: string): NewbornVaccine[] {
  const db = getMockDb();
  return db.newborn_vaccines.filter(v => v.newborn_id === newbornId);
}

export function addNewbornVaccine(vaccine: Omit<NewbornVaccine, 'id'>) {
  const db = getMockDb();
  const newVaccine: NewbornVaccine = {
    ...vaccine,
    id: `nvac-${Date.now()}`
  };
  db.newborn_vaccines.push(newVaccine);
  saveMockDb(db);
}
