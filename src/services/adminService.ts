import { supabase } from '@/lib/supabase';

export interface AdminStats {
  totalUsers: number;
  totalMothers: number;
  totalProfessionals: number;
  totalPrescriptions: number;
  totalAppointments: number;
  pendingDocuments: number;
  pendingProfessionals: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin';
  status: string;
  created_at: string;
  avatar_url?: string;
}

export interface ProfessionalProfile extends UserProfile {
  specialty: string;
  exequatur: string;
  is_verified: boolean;
  verification_date?: string;
  clinic_address?: string;
  consultation_fee?: number;
  rating?: number;
}

/**
 * Verificar si existen administradores en el sistema
 */
export async function hasAdmins(): Promise<boolean> {
  try {
    // Usamos una consulta directa y rápida para contar administradores
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (error) {
      console.error('Error checking for admins:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (err) {
    console.error('Exception checking for admins:', err);
    return false;
  }
}

/**
 * Obtener estadísticas del sistema
 */
export async function getSystemStats(): Promise<AdminStats> {
  try {
    const [
      { count: users },
      { count: mothers },
      { count: professionals },
      { count: prescriptions },
      { count: appointments },
      { count: pendingDocs },
      { count: pendingProfs }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('mothers').select('*', { count: 'exact', head: true }),
      supabase.from('professionals').select('*', { count: 'exact', head: true }),
      supabase.from('prescriptions').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('professional_documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('professionals').select('*', { count: 'exact', head: true }).eq('is_verified', false)
    ]);

    return {
      totalUsers: users || 0,
      totalMothers: mothers || 0,
      totalProfessionals: professionals || 0,
      totalPrescriptions: prescriptions || 0,
      totalAppointments: appointments || 0,
      pendingDocuments: pendingDocs || 0,
      pendingProfessionals: pendingProfs || 0,
    };
  } catch (err) {
    console.error('Error getting system stats:', err);
    throw err;
  }
}

/**
 * Obtener todos los usuarios (solo para admins)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserProfile[];
  } catch (err) {
    console.error('Error fetching all users:', err);
    throw err;
  }
}

/**
 * Obtener todos los profesionales pendientes de verificación
 */
export async function getPendingProfessionals(): Promise<ProfessionalProfile[]> {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('*, profiles:id(email, full_name, avatar_url)')
      .eq('is_verified', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as ProfessionalProfile[];
  } catch (err) {
    console.error('Error fetching pending professionals:', err);
    throw err;
  }
}

/**
 * Actualizar el estado de un usuario
 */
export async function updateUserStatus(userId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Cambiar el rol de un usuario
 */
export async function changeUserRole(userId: string, role: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Registrar una acción de administrador en el audit log
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  recordId: string,
  details: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: adminId,
          action: `admin_${action}`,
          table_affected: 'admin_actions',
          record_id: recordId,
          new_value: details,
          event: `Admin action: ${action}`,
        },
      ]);
  } catch (err) {
    console.error('Error logging admin action:', err);
  }
}
