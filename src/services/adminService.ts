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
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) throw error;

    return (data && data.length > 0) || false;
  } catch (err) {
    console.error('Error checking for admins:', err);
    return false;
  }
}

/**
 * Obtener estadísticas del sistema
 */
export async function getSystemStats(): Promise<AdminStats> {
  try {
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' });

    const { data: mothers, error: mothersError } = await supabase
      .from('mothers')
      .select('id', { count: 'exact' });

    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('id', { count: 'exact' });

    const { data: prescriptions, error: prescError } = await supabase
      .from('prescriptions')
      .select('id', { count: 'exact' });

    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('id', { count: 'exact' });

    const { data: pendingDocs, error: docsError } = await supabase
      .from('professional_documents')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    const { data: pendingProfs, error: profPendError } = await supabase
      .from('professionals')
      .select('id', { count: 'exact' })
      .eq('is_verified', false);

    if (usersError || mothersError || profError || prescError || apptError || docsError || profPendError) {
      throw new Error('Error fetching stats');
    }

    return {
      totalUsers: users?.length || 0,
      totalMothers: mothers?.length || 0,
      totalProfessionals: professionals?.length || 0,
      totalPrescriptions: prescriptions?.length || 0,
      totalAppointments: appointments?.length || 0,
      pendingDocuments: pendingDocs?.length || 0,
      pendingProfessionals: pendingProfs?.length || 0,
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
 * Obtener todos los profesionales verificados
 */
export async function getVerifiedProfessionals(): Promise<ProfessionalProfile[]> {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('is_verified', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as ProfessionalProfile[];
  } catch (err) {
    console.error('Error fetching verified professionals:', err);
    throw err;
  }
}

/**
 * Verificar un profesional
 */
export async function verifyProfessional(
  professionalId: string,
  verificationNotes?: string
): Promise<ProfessionalProfile> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('professionals')
      .update({
        is_verified: true,
        verification_date: new Date().toISOString(),
        verified_by: session.user.id,
        verification_notes: verificationNotes,
      })
      .eq('id', professionalId)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    await logAdminAction(
      session.user.id,
      'verify_professional',
      professionalId,
      { verified: true, notes: verificationNotes }
    );

    return data as ProfessionalProfile;
  } catch (err) {
    console.error('Error verifying professional:', err);
    throw err;
  }
}

/**
 * Rechazar un profesional
 */
export async function rejectProfessional(
  professionalId: string,
  rejectionReason: string
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    // Eliminar el profesional
    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', professionalId);

    if (error) throw error;

    // Registrar en audit log
    await logAdminAction(
      session.user.id,
      'reject_professional',
      professionalId,
      { reason: rejectionReason }
    );
  } catch (err) {
    console.error('Error rejecting professional:', err);
    throw err;
  }
}

/**
 * Suspender a un usuario
 */
export async function suspendUser(userId: string, reason: string): Promise<UserProfile> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        status: 'suspended',
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    await logAdminAction(
      session.user.id,
      'suspend_user',
      userId,
      { reason }
    );

    return data as UserProfile;
  } catch (err) {
    console.error('Error suspending user:', err);
    throw err;
  }
}

/**
 * Reactivar a un usuario
 */
export async function reactivateUser(userId: string): Promise<UserProfile> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        status: 'approved',
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    await logAdminAction(
      session.user.id,
      'reactivate_user',
      userId,
      {}
    );

    return data as UserProfile;
  } catch (err) {
    console.error('Error reactivating user:', err);
    throw err;
  }
}

/**
 * Cambiar el rol de un usuario
 */
export async function changeUserRole(
  userId: string,
  newRole: 'mother' | 'obstetrician' | 'pediatrician' | 'admin'
): Promise<UserProfile> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    await logAdminAction(
      session.user.id,
      'change_user_role',
      userId,
      { newRole }
    );

    return data as UserProfile;
  } catch (err) {
    console.error('Error changing user role:', err);
    throw err;
  }
}

/**
 * Obtener todas las recetas (para auditoría)
 */
export async function getAllPrescriptions(limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as any[];
  } catch (err) {
    console.error('Error fetching all prescriptions:', err);
    throw err;
  }
}

/**
 * Obtener todas las citas (para auditoría)
 */
export async function getAllAppointments(limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as any[];
  } catch (err) {
    console.error('Error fetching all appointments:', err);
    throw err;
  }
}

/**
 * Obtener logs de auditoría
 */
export async function getAuditLogs(limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as any[];
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    throw err;
  }
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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.warn('No authenticated user for admin action log');
      return;
    }

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

/**
 * Obtener documentos pendientes de revisión
 */
export async function getPendingDocuments(): Promise<any[]> {
  try {
    const { data: profDocs, error: profError } = await supabase
      .from('professional_documents')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (profError) throw profError;

    const { data: motherDocs, error: motherError } = await supabase
      .from('mother_documents')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (motherError) throw motherError;

    return [...(profDocs || []), ...(motherDocs || [])] as any[];
  } catch (err) {
    console.error('Error fetching pending documents:', err);
    throw err;
  }
}

/**
 * Aprobar un documento
 */
export async function approveDocument(
  documentId: string,
  documentType: 'professional' | 'mother',
  notes?: string
): Promise<void> {
  try {
    const table = documentType === 'professional' ? 'professional_documents' : 'mother_documents';

    const { error } = await supabase
      .from(table)
      .update({
        status: 'approved',
        notes,
      })
      .eq('id', documentId);

    if (error) throw error;

    // Registrar en audit log
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await logAdminAction(
        session.user.id,
        'approve_document',
        documentId,
        { documentType, notes }
      );
    }
  } catch (err) {
    console.error('Error approving document:', err);
    throw err;
  }
}

/**
 * Rechazar un documento
 */
export async function rejectDocument(
  documentId: string,
  documentType: 'professional' | 'mother',
  rejectionReason: string
): Promise<void> {
  try {
    const table = documentType === 'professional' ? 'professional_documents' : 'mother_documents';

    const { error } = await supabase
      .from(table)
      .update({
        status: 'needs_correction',
        notes: rejectionReason,
      })
      .eq('id', documentId);

    if (error) throw error;

    // Registrar en audit log
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await logAdminAction(
        session.user.id,
        'reject_document',
        documentId,
        { documentType, reason: rejectionReason }
      );
    }
  } catch (err) {
    console.error('Error rejecting document:', err);
    throw err;
  }
}
