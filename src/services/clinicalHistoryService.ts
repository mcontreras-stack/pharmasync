import { supabase } from '@/lib/supabase';

export interface ClinicalHistory {
  id: string; // mother_id
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_asthma: boolean;
  has_heart_disease: boolean;
  has_autoimmune: boolean;
  chronic_illnesses?: string;
  past_surgeries?: string;
  past_hospitalizations?: string;
  allergies?: string;
  permanent_medications?: string;
  fam_diabetes: boolean;
  fam_hypertension: boolean;
  fam_cancer: boolean;
  fam_genetic_diseases?: string;
  fam_cardiovascular: boolean;
  past_pregnancies: number;
  past_abortions: number;
  past_c_sections: number;
  past_vaginal_births: number;
  past_ectopic_pregnancies: number;
  obstetric_complications?: string;
  updated_at: string;
}

/**
 * Obtener el historial clínico de una madre
 */
export async function getClinicalHistory(motherId: string): Promise<ClinicalHistory | null> {
  try {
    const { data, error } = await supabase
      .from('clinical_histories')
      .select('*')
      .eq('id', motherId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found, es normal para usuarios nuevos
      return null;
    }

    if (error) throw error;

    return data as ClinicalHistory;
  } catch (err) {
    console.error('Error fetching clinical history:', err);
    throw err;
  }
}

/**
 * Guardar o actualizar el historial clínico de una madre
 */
export async function saveClinicalHistory(history: ClinicalHistory): Promise<ClinicalHistory> {
  try {
    const { data, error } = await supabase
      .from('clinical_histories')
      .upsert([
        {
          ...history,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return data as ClinicalHistory;
  } catch (err) {
    console.error('Error saving clinical history:', err);
    throw err;
  }
}

/**
 * Crear un historial clínico vacío para una madre
 */
export async function createEmptyClinicalHistory(motherId: string): Promise<ClinicalHistory> {
  const emptyHistory: ClinicalHistory = {
    id: motherId,
    has_diabetes: false,
    has_hypertension: false,
    has_asthma: false,
    has_heart_disease: false,
    has_autoimmune: false,
    fam_diabetes: false,
    fam_hypertension: false,
    fam_cancer: false,
    fam_cardiovascular: false,
    past_pregnancies: 0,
    past_abortions: 0,
    past_c_sections: 0,
    past_vaginal_births: 0,
    past_ectopic_pregnancies: 0,
    updated_at: new Date().toISOString(),
  };

  return saveClinicalHistory(emptyHistory);
}

/**
 * Actualizar un campo específico del historial clínico
 */
export async function updateClinicalHistoryField(
  motherId: string,
  field: keyof ClinicalHistory,
  value: any
): Promise<ClinicalHistory> {
  try {
    const { data, error } = await supabase
      .from('clinical_histories')
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', motherId)
      .select()
      .single();

    if (error) throw error;

    return data as ClinicalHistory;
  } catch (err) {
    console.error(`Error updating clinical history field ${field}:`, err);
    throw err;
  }
}

/**
 * Obtener todos los historiales clínicos (solo para admins)
 */
export async function getAllClinicalHistories(): Promise<ClinicalHistory[]> {
  try {
    const { data, error } = await supabase
      .from('clinical_histories')
      .select('*');

    if (error) throw error;

    return data as ClinicalHistory[];
  } catch (err) {
    console.error('Error fetching all clinical histories:', err);
    throw err;
  }
}

/**
 * Registrar un evento en el audit log de historial clínico
 */
export async function logClinicalHistoryChange(
  motherId: string,
  action: string,
  previousState?: any,
  newState?: any
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.warn('No authenticated user for audit log');
      return;
    }

    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: session.user.id,
          user_email: session.user.email,
          action,
          table_affected: 'clinical_histories',
          record_id: motherId,
          old_value: previousState,
          new_value: newState,
          ip_address: 'N/A', // Se puede obtener del cliente si es necesario
          user_role: 'unknown', // Se puede obtener del perfil del usuario
        },
      ]);
  } catch (err) {
    console.error('Error logging clinical history change:', err);
    // No lanzar error, solo registrar en consola
  }
}
