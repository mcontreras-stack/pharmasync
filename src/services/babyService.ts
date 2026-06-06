import { supabase } from '@/lib/supabase';

export interface Baby {
  id: string;
  mother_id: string;
  pediatrician_id?: string;
  pregnancy_id?: string;
  name: string;
  birth_date: string;
  birth_time?: string;
  birth_weight_grams?: number;
  birth_height_cm?: number;
  birth_head_circ_cm?: number;
  gender?: string;
  blood_type?: string;
  allergies?: string;
  created_at: string;
}

export interface NewbornRecord {
  baby_id: string;
  apgar_score_1min?: number;
  apgar_score_5min?: number;
  apgar_score_10min?: number;
  birth_complications?: string;
  resuscitation_required: boolean;
  medications_given?: string;
  feeding_type: 'breast' | 'bottle' | 'mixed';
  first_feeding_time?: string;
  notes?: string;
}

export interface Vaccine {
  id: string;
  name: string;
  target_disease: string;
  recommended_age_months: number;
  dose_number: number;
  description?: string;
}

export interface BabyVaccine {
  id: string;
  baby_id: string;
  vaccine_id: string;
  applied_date?: string;
  status: 'pending' | 'scheduled' | 'applied';
  lot_number?: string;
  pediatrician_id?: string;
  notes?: string;
  created_at: string;
}

/**
 * Crear un nuevo registro de bebé
 */
export async function createBaby(
  motherId: string,
  name: string,
  birthDate: string,
  birthTimeStr?: string,
  birthWeightGrams?: number,
  birthHeightCm?: number,
  birthHeadCircCm?: number,
  gender?: string,
  bloodType?: string,
  allergies?: string,
  pregnancyId?: string,
  pediatricianId?: string
): Promise<Baby> {
  try {
    const { data, error } = await supabase
      .from('babies')
      .insert([
        {
          mother_id: motherId,
          name,
          birth_date: birthDate,
          birth_time: birthTimeStr,
          birth_weight_grams: birthWeightGrams,
          birth_height_cm: birthHeightCm,
          birth_head_circ_cm: birthHeadCircCm,
          gender,
          blood_type: bloodType,
          allergies,
          pregnancy_id: pregnancyId,
          pediatrician_id: pediatricianId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data as Baby;
  } catch (err) {
    console.error('Error creating baby:', err);
    throw err;
  }
}

/**
 * Obtener un bebé por ID
 */
export async function getBaby(babyId: string): Promise<Baby | null> {
  try {
    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('id', babyId)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) throw error;

    return data as Baby;
  } catch (err) {
    console.error('Error fetching baby:', err);
    throw err;
  }
}

/**
 * Obtener todos los bebés de una madre
 */
export async function getMotherBabies(motherId: string): Promise<Baby[]> {
  try {
    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('mother_id', motherId)
      .order('birth_date', { ascending: false });

    if (error) throw error;

    return (data || []) as Baby[];
  } catch (err) {
    console.error('Error fetching mother babies:', err);
    throw err;
  }
}

/**
 * Actualizar información de un bebé
 */
export async function updateBaby(babyId: string, updates: Partial<Baby>): Promise<Baby> {
  try {
    const { data, error } = await supabase
      .from('babies')
      .update(updates)
      .eq('id', babyId)
      .select()
      .single();

    if (error) throw error;

    return data as Baby;
  } catch (err) {
    console.error('Error updating baby:', err);
    throw err;
  }
}

/**
 * Registrar datos del recién nacido (APGAR, complicaciones, etc.)
 */
export async function recordNewbornData(
  babyId: string,
  apgarScore1min?: number,
  apgarScore5min?: number,
  apgarScore10min?: number,
  birthComplications?: string,
  resuscitationRequired: boolean = false,
  medicationsGiven?: string,
  feedingType: 'breast' | 'bottle' | 'mixed' = 'breast',
  firstFeedingTime?: string,
  notes?: string
): Promise<unknown> {
  try {
    // Actualizar el bebé con información adicional si es necesaria
    // En este caso, solo registramos en la tabla de visitas pediátricas iniciales
    const { data, error } = await supabase
      .from('pediatric_visits')
      .insert([
        {
          baby_id: babyId,
          visit_date: new Date().toISOString().split('T')[0],
          weight_kg: 0, // Se actualizará después
          height_cm: 0, // Se actualizará después
          notes: `Newborn Record - APGAR: ${apgarScore1min}/${apgarScore5min}/${apgarScore10min}, Resuscitation: ${resuscitationRequired ? 'Yes' : 'No'}, Complications: ${birthComplications || 'None'}, Feeding: ${feedingType}. Medications: ${medicationsGiven || 'None'}. First feeding: ${firstFeedingTime || 'N/A'}. ${notes || ''}`,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error recording newborn data:', err);
    throw err;
  }
}

/**
 * Obtener todas las vacunas disponibles
 */
export async function getAvailableVaccines(): Promise<Vaccine[]> {
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .order('recommended_age_months', { ascending: true });

    if (error) throw error;

    return (data || []) as Vaccine[];
  } catch (err) {
    console.error('Error fetching vaccines:', err);
    throw err;
  }
}

/**
 * Obtener el esquema de vacunación recomendado para un bebé
 */
export async function getRecommendedVaccineSchedule(ageMonths: number): Promise<Vaccine[]> {
  try {
    const { data, error } = await supabase
      .from('vaccines')
      .select('*')
      .lte('recommended_age_months', ageMonths)
      .order('recommended_age_months', { ascending: true });

    if (error) throw error;

    return (data || []) as Vaccine[];
  } catch (err) {
    console.error('Error fetching vaccine schedule:', err);
    throw err;
  }
}

/**
 * Registrar una vacuna aplicada
 */
export async function recordVaccine(
  babyId: string,
  vaccineId: string,
  appliedDate: string,
  lotNumber?: string,
  pediatricianId?: string,
  notes?: string
): Promise<BabyVaccine> {
  try {
    const { data, error } = await supabase
      .from('baby_vaccines')
      .insert([
        {
          baby_id: babyId,
          vaccine_id: vaccineId,
          applied_date: appliedDate,
          status: 'applied',
          lot_number: lotNumber,
          pediatrician_id: pediatricianId,
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data as BabyVaccine;
  } catch (err) {
    console.error('Error recording vaccine:', err);
    throw err;
  }
}

/**
 * Obtener historial de vacunas de un bebé
 */
export async function getBabyVaccineHistory(babyId: string): Promise<BabyVaccine[]> {
  try {
    const { data, error } = await supabase
      .from('baby_vaccines')
      .select('*')
      .eq('baby_id', babyId)
      .order('applied_date', { ascending: false });

    if (error) throw error;

    return (data || []) as BabyVaccine[];
  } catch (err) {
    console.error('Error fetching baby vaccine history:', err);
    throw err;
  }
}

/**
 * Registrar un hito de desarrollo
 */
export async function recordDevelopmentMilestone(
  babyId: string,
  category: string,
  milestoneName: string,
  targetAgeMonths: number,
  achievedDate?: string,
  notes?: string
): Promise<unknown> {
  try {
    const { data, error } = await supabase
      .from('development_milestones')
      .insert([
        {
          baby_id: babyId,
          category,
          milestone_name: milestoneName,
          target_age_months: targetAgeMonths,
          achieved_date: achievedDate,
          status: achievedDate ? 'achieved' : 'pending',
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error recording development milestone:', err);
    throw err;
  }
}

/**
 * Obtener hitos de desarrollo de un bebé
 */
export async function getBabyMilestones(babyId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabase
      .from('development_milestones')
      .select('*')
      .eq('baby_id', babyId)
      .order('target_age_months', { ascending: true });

    if (error) throw error;

    return (data || []) as unknown[];
  } catch (err) {
    console.error('Error fetching baby milestones:', err);
    throw err;
  }
}

/**
 * Registrar medidas de crecimiento
 */
export async function recordGrowthMeasurement(
  babyId: string,
  recordDate: string,
  ageMonths: number,
  weightKg: number,
  heightCm: number,
  headCircCm?: number,
  weightPercentile?: number,
  heightPercentile?: number
): Promise<unknown> {
  try {
    const { data, error } = await supabase
      .from('growth_records')
      .insert([
        {
          baby_id: babyId,
          record_date: recordDate,
          age_months: ageMonths,
          weight_kg: weightKg,
          height_cm: heightCm,
          head_circ_cm: headCircCm,
          weight_percentile: weightPercentile,
          height_percentile: heightPercentile,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error recording growth measurement:', err);
    throw err;
  }
}

/**
 * Obtener historial de crecimiento de un bebé
 */
export async function getBabyGrowthHistory(babyId: string): Promise<unknown[]> {
  try {
    const { data, error } = await supabase
      .from('growth_records')
      .select('*')
      .eq('baby_id', babyId)
      .order('record_date', { ascending: true });

    if (error) throw error;

    return (data || []) as unknown[];
  } catch (err) {
    console.error('Error fetching baby growth history:', err);
    throw err;
  }
}
