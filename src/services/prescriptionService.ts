import { supabase } from '@/lib/supabase';

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  generic_name: string;
  commercial_name?: string;
  concentration: string;
  pharmaceutical_form: string;
  presentation: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  warnings?: string;
}

export interface Prescription {
  id: string;
  doctor_id: string;
  mother_id: string;
  baby_id?: string;
  diagnosis: string;
  is_controlled: boolean;
  status: 'activa' | 'expirada' | 'cancelada' | 'dispensada';
  code: string;
  expiry_date: string;
  created_at: string;
  uuid: string;
  qr_code_url?: string;
  validation_code?: string;
  items?: PrescriptionItem[];
}

/**
 * Crear una nueva receta
 */
export async function createPrescription(
  doctorId: string,
  motherId: string,
  diagnosis: string,
  expiryDate: string,
  items: Omit<PrescriptionItem, 'id' | 'prescription_id'>[]
): Promise<Prescription> {
  try {
    // Generar código único para la receta
    const code = `RX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const validationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert([
        {
          doctor_id: doctorId,
          mother_id: motherId,
          diagnosis,
          status: 'activa',
          code,
          expiry_date: expiryDate,
          validation_code: validationCode,
          is_controlled: false,
        },
      ])
      .select()
      .single();

    if (prescriptionError) throw prescriptionError;

    // Insertar los items de la receta
    if (items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        ...item,
        prescription_id: prescription.id,
      }));

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Obtener los items creados
      const { data: createdItems } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', prescription.id);

      return {
        ...prescription,
        items: createdItems || [],
      };
    }

    return {
      ...prescription,
      items: [],
    };
  } catch (err) {
    console.error('Error creating prescription:', err);
    throw err;
  }
}

/**
 * Obtener una receta por ID
 */
export async function getPrescription(prescriptionId: string): Promise<Prescription | null> {
  try {
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (prescriptionError && prescriptionError.code === 'PGRST116') {
      return null;
    }

    if (prescriptionError) throw prescriptionError;

    // Obtener los items
    const { data: items, error: itemsError } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('prescription_id', prescriptionId);

    if (itemsError) throw itemsError;

    return {
      ...prescription,
      items: items || [],
    };
  } catch (err) {
    console.error('Error fetching prescription:', err);
    throw err;
  }
}

/**
 * Obtener recetas de una madre
 */
export async function getMotherPrescriptions(motherId: string): Promise<Prescription[]> {
  try {
    const { data: prescriptions, error: prescriptionsError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('mother_id', motherId)
      .order('created_at', { ascending: false });

    if (prescriptionsError) throw prescriptionsError;

    // Obtener items para cada receta
    const prescriptionsWithItems = await Promise.all(
      (prescriptions || []).map(async (prescription) => {
        const { data: items } = await supabase
          .from('prescription_items')
          .select('*')
          .eq('prescription_id', prescription.id);

        return {
          ...prescription,
          items: items || [],
        };
      })
    );

    return prescriptionsWithItems;
  } catch (err) {
    console.error('Error fetching mother prescriptions:', err);
    throw err;
  }
}

/**
 * Obtener recetas de un doctor
 */
export async function getDoctorPrescriptions(doctorId: string): Promise<Prescription[]> {
  try {
    const { data: prescriptions, error: prescriptionsError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (prescriptionsError) throw prescriptionsError;

    // Obtener items para cada receta
    const prescriptionsWithItems = await Promise.all(
      (prescriptions || []).map(async (prescription) => {
        const { data: items } = await supabase
          .from('prescription_items')
          .select('*')
          .eq('prescription_id', prescription.id);

        return {
          ...prescription,
          items: items || [],
        };
      })
    );

    return prescriptionsWithItems;
  } catch (err) {
    console.error('Error fetching doctor prescriptions:', err);
    throw err;
  }
}

/**
 * Actualizar el estado de una receta
 */
export async function updatePrescriptionStatus(
  prescriptionId: string,
  status: 'activa' | 'expirada' | 'cancelada' | 'dispensada'
): Promise<Prescription> {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .update({ status })
      .eq('id', prescriptionId)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    await logPrescriptionChange(prescriptionId, `Status updated to ${status}`);

    return data as Prescription;
  } catch (err) {
    console.error('Error updating prescription status:', err);
    throw err;
  }
}

/**
 * Verificar una receta por código de validación
 */
export async function verifyPrescription(validationCode: string): Promise<Prescription | null> {
  try {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('validation_code', validationCode)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error) throw error;

    // Obtener los items
    const { data: items } = await supabase
      .from('prescription_items')
      .select('*')
      .eq('prescription_id', prescription.id);

    return {
      ...prescription,
      items: items || [],
    };
  } catch (err) {
    console.error('Error verifying prescription:', err);
    throw err;
  }
}

/**
 * Registrar una verificación de receta
 */
export async function logPrescriptionVerification(
  prescriptionId: string,
  verifiedBy: string,
  ipAddress: string
): Promise<void> {
  try {
    await supabase
      .from('prescription_verifications')
      .insert([
        {
          prescription_id: prescriptionId,
          verified_by: verifiedBy,
          ip_address: ipAddress,
        },
      ]);
  } catch (err) {
    console.error('Error logging prescription verification:', err);
    throw err;
  }
}

/**
 * Registrar un cambio en una receta en el audit log
 */
export async function logPrescriptionChange(
  prescriptionId: string,
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
      .from('prescription_audit_logs')
      .insert([
        {
          prescription_id: prescriptionId,
          changed_by: session.user.id,
          action,
          previous_state: previousState,
          new_state: newState,
        },
      ]);
  } catch (err) {
    console.error('Error logging prescription change:', err);
    // No lanzar error, solo registrar en consola
  }
}

/**
 * Cancelar una receta
 */
export async function cancelPrescription(prescriptionId: string, reason?: string): Promise<Prescription> {
  try {
    const prescription = await getPrescription(prescriptionId);
    if (!prescription) throw new Error('Prescription not found');

    await logPrescriptionChange(
      prescriptionId,
      'Prescription cancelled',
      { status: prescription.status },
      { status: 'cancelada', reason }
    );

    return updatePrescriptionStatus(prescriptionId, 'cancelada');
  } catch (err) {
    console.error('Error cancelling prescription:', err);
    throw err;
  }
}

/**
 * Marcar una receta como dispensada
 */
export async function markPrescriptionAsDispensed(prescriptionId: string, pharmacyName: string): Promise<Prescription> {
  try {
    const prescription = await getPrescription(prescriptionId);
    if (!prescription) throw new Error('Prescription not found');

    await logPrescriptionChange(
      prescriptionId,
      'Prescription dispensed',
      { status: prescription.status },
      { status: 'dispensada', pharmacy: pharmacyName }
    );

    await logPrescriptionVerification(prescriptionId, pharmacyName, 'N/A');

    return updatePrescriptionStatus(prescriptionId, 'dispensada');
  } catch (err) {
    console.error('Error marking prescription as dispensed:', err);
    throw err;
  }
}
