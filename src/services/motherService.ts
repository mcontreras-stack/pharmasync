import { supabase } from '@/lib/supabase';
import { getDataBackend, apiJson } from '@/lib/backend';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import type { Mother, Pregnancy, Baby } from '@/types/core';
import type { BabyVaccine, DevelopmentMilestone, Symptom, VitalSign } from '@/types/database';

export interface NewBirthInput {
  name: string;
  birth_date: string;
  gender: string;
  birth_weight_grams?: number;
  birth_height_cm?: number;
  pregnancy_id?: string | null;
}

/** Datos clínicos de la madre (ficha). Devuelve null si aún no los completó. */
export async function getMotherRecord(motherId: string): Promise<Mother | null> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    return getMockDb().mothers.find(m => m.id === motherId) || null;
  }

  if (backend === 'postgres') {
    const { mother } = await apiJson<{ mother: Mother | null }>(`/api/mothers/${motherId}`);
    return mother;
  }

  const { data, error } = await supabase.from('mothers').select('*').eq('id', motherId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Guarda (crea o actualiza) la ficha de la madre. */
export async function saveMotherRecord(motherId: string, data: Partial<Mother>): Promise<void> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    const idx = db.mothers.findIndex(m => m.id === motherId);
    const base: Mother = idx >= 0 ? db.mothers[idx] : {
      id: motherId, phone: '', birth_date: '', emergency_contact_name: '', emergency_contact_phone: '', blood_type: '',
    };
    const updated = { ...base, ...data, id: motherId };
    if (idx >= 0) db.mothers[idx] = updated;
    else db.mothers.push(updated);
    saveMockDb(db);
    return;
  }

  if (backend === 'postgres') {
    await apiJson(`/api/mothers/${motherId}`, { method: 'PUT', body: JSON.stringify(data) });
    return;
  }

  const { error } = await supabase.from('mothers').upsert({ ...data, id: motherId });
  if (error) throw error;
}

/** Embarazo activo de la madre, o null. */
export async function getActivePregnancy(motherId: string): Promise<Pregnancy | null> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    return getMockDb().pregnancies.find(p => p.mother_id === motherId && p.status === 'active') || null;
  }

  if (backend === 'postgres') {
    const { pregnancies } = await apiJson<{ pregnancies: Pregnancy[] }>(`/api/pregnancies?motherId=${motherId}`);
    return pregnancies.find(p => p.status === 'active') || null;
  }

  const { data, error } = await supabase
    .from('pregnancies')
    .select('*')
    .eq('mother_id', motherId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Registrar un embarazo nuevo. FPP = FUM + 280 días si no se especifica. */
export async function createPregnancy(
  motherId: string,
  lastMenstrualPeriod: string,
  estimatedDueDate?: string,
  notes?: string
): Promise<Pregnancy> {
  const edd = estimatedDueDate || (() => {
    const d = new Date(lastMenstrualPeriod);
    d.setDate(d.getDate() + 280);
    return d.toISOString().slice(0, 10);
  })();

  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    if (db.pregnancies.some(p => p.mother_id === motherId && p.status === 'active')) {
      throw new Error('Ya existe un embarazo activo registrado.');
    }
    const pregnancy: Pregnancy = {
      id: `preg-${Date.now()}`,
      mother_id: motherId,
      obstetrician_id: null,
      status: 'active',
      last_menstrual_period: lastMenstrualPeriod,
      estimated_due_date: edd,
      weeks_gestation_offset: 0,
      notes,
    };
    db.pregnancies.push(pregnancy);
    saveMockDb(db);
    return pregnancy;
  }

  if (backend === 'postgres') {
    const { pregnancy } = await apiJson<{ pregnancy: Pregnancy }>('/api/pregnancies', {
      method: 'POST',
      body: JSON.stringify({ mother_id: motherId, last_menstrual_period: lastMenstrualPeriod, estimated_due_date: edd, notes }),
    });
    return pregnancy;
  }

  // Supabase: asegurar registro de madre (FK) y crear el embarazo
  await supabase.from('mothers').upsert({ id: motherId });
  const { data, error } = await supabase
    .from('pregnancies')
    .insert({ mother_id: motherId, status: 'active', last_menstrual_period: lastMenstrualPeriod, estimated_due_date: edd, notes })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Bebés registrados de la madre. */
export async function getBabies(motherId: string): Promise<Baby[]> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    return getMockDb().babies.filter(b => b.mother_id === motherId);
  }

  if (backend === 'postgres') {
    const { babies } = await apiJson<{ babies: Baby[] }>(`/api/babies?motherId=${motherId}`);
    return babies;
  }

  const { data, error } = await supabase.from('babies').select('*').eq('mother_id', motherId);
  if (error) throw error;
  return data || [];
}

/**
 * Registrar el nacimiento de un bebé. Si viene de un embarazo activo,
 * lo marca como completado ("graduación").
 */
export async function registerBirth(motherId: string, input: NewBirthInput): Promise<Baby> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    const baby: Baby = {
      id: `baby-${Date.now()}`,
      mother_id: motherId,
      pregnancy_id: input.pregnancy_id || null,
      pediatrician_id: null,
      name: input.name,
      birth_date: input.birth_date,
      gender: input.gender,
      birth_weight_grams: input.birth_weight_grams,
      birth_height_cm: input.birth_height_cm,
    };
    db.babies.push(baby);

    if (input.pregnancy_id) {
      db.pregnancies = db.pregnancies.map(p => p.id === input.pregnancy_id ? { ...p, status: 'completed' as const } : p);
    }

    // Esquema de vacunación e hitos iniciales (solo demo)
    const babyVaccines: BabyVaccine[] = db.vaccines.map(v => ({
      id: `bvac-${Date.now()}-${v.id}`,
      baby_id: baby.id,
      vaccine_id: v.id,
      status: v.recommended_age_months === 0 ? 'applied' : 'pending',
      applied_date: v.recommended_age_months === 0 ? input.birth_date : undefined,
    }));
    const milestones: DevelopmentMilestone[] = [
      { id: `mil-${Date.now()}-1`, baby_id: baby.id, category: 'Motor', milestone_name: 'Sostiene la cabeza erguida', target_age_months: 3, status: 'pending' },
      { id: `mil-${Date.now()}-2`, baby_id: baby.id, category: 'Social', milestone_name: 'Sonrisa social espontánea', target_age_months: 2, status: 'pending' },
      { id: `mil-${Date.now()}-3`, baby_id: baby.id, category: 'Lenguaje', milestone_name: 'Balbucea sonidos', target_age_months: 4, status: 'pending' },
    ];
    db.baby_vaccines.push(...babyVaccines);
    db.development_milestones.push(...milestones);
    saveMockDb(db);
    return baby;
  }

  if (backend === 'postgres') {
    const { baby } = await apiJson<{ baby: Baby }>('/api/babies', {
      method: 'POST',
      body: JSON.stringify({ mother_id: motherId, ...input }),
    });
    return baby;
  }

  await supabase.from('mothers').upsert({ id: motherId });
  const { data, error } = await supabase
    .from('babies')
    .insert({
      mother_id: motherId,
      pregnancy_id: input.pregnancy_id || null,
      name: input.name,
      birth_date: input.birth_date,
      gender: input.gender,
      birth_weight_grams: input.birth_weight_grams,
      birth_height_cm: input.birth_height_cm,
    })
    .select()
    .single();
  if (error) throw error;

  if (input.pregnancy_id) {
    await supabase.from('pregnancies').update({ status: 'completed' }).eq('id', input.pregnancy_id);
  }
  return data;
}

// ─── Síntomas ────────────────────────────────────────────────────────────────

export async function getSymptoms(motherId: string, pregnancyId?: string): Promise<Symptom[]> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    return getMockDb().symptoms.filter(s => s.mother_id === motherId || (pregnancyId && s.pregnancy_id === pregnancyId));
  }

  if (backend === 'postgres') {
    const { symptoms } = await apiJson<{ symptoms: Symptom[] }>(`/api/symptoms?motherId=${motherId}`);
    return symptoms;
  }

  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .eq('mother_id', motherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addSymptom(
  motherId: string,
  input: { pregnancy_id?: string | null; symptom_name: string; intensity: 'Bajo' | 'Medio' | 'Alto'; notes?: string }
): Promise<Symptom> {
  const backend = getDataBackend();
  const today = new Date().toISOString().split('T')[0];

  if (backend === 'demo') {
    const db = getMockDb();
    const symptom: Symptom = {
      id: `sym-${Date.now()}`,
      mother_id: motherId,
      pregnancy_id: input.pregnancy_id || '',
      symptom_name: input.symptom_name,
      intensity: input.intensity,
      logged_date: today,
      notes: input.notes,
    };
    db.symptoms = [symptom, ...db.symptoms];
    saveMockDb(db);
    return symptom;
  }

  if (backend === 'postgres') {
    const { symptom } = await apiJson<{ symptom: Symptom }>('/api/symptoms', {
      method: 'POST',
      body: JSON.stringify({ mother_id: motherId, ...input }),
    });
    return symptom;
  }

  await supabase.from('mothers').upsert({ id: motherId });
  const { data, error } = await supabase
    .from('symptoms')
    .insert({
      mother_id: motherId,
      pregnancy_id: input.pregnancy_id || null,
      symptom_name: input.symptom_name,
      intensity: input.intensity,
      notes: input.notes || null,
      logged_date: today,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Signos vitales ──────────────────────────────────────────────────────────

export async function getVitals(motherId: string, pregnancyId?: string): Promise<VitalSign[]> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    return getMockDb().vital_signs.filter(v => v.mother_id === motherId || (pregnancyId && v.pregnancy_id === pregnancyId));
  }

  if (backend === 'postgres') {
    const { vitals } = await apiJson<{ vitals: VitalSign[] }>(`/api/vitals?motherId=${motherId}`);
    return vitals;
  }

  const { data, error } = await supabase
    .from('vital_signs')
    .select('*')
    .eq('mother_id', motherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addVital(
  motherId: string,
  input: { weight_kg?: number; systolic_bp?: number; diastolic_bp?: number; heart_rate_bpm?: number; temperature_c?: number }
): Promise<VitalSign> {
  const backend = getDataBackend();
  const today = new Date().toISOString().split('T')[0];

  if (backend === 'demo') {
    const db = getMockDb();
    const vital: VitalSign = {
      id: `vit-${Date.now()}`,
      mother_id: motherId,
      logged_date: today,
      ...input,
    };
    db.vital_signs = [vital, ...db.vital_signs];
    saveMockDb(db);
    return vital;
  }

  if (backend === 'postgres') {
    const { vital } = await apiJson<{ vital: VitalSign }>('/api/vitals', {
      method: 'POST',
      body: JSON.stringify({ mother_id: motherId, ...input }),
    });
    return vital;
  }

  await supabase.from('mothers').upsert({ id: motherId });
  const { data, error } = await supabase
    .from('vital_signs')
    .insert({ mother_id: motherId, logged_date: today, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}
