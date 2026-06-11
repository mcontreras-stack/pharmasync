import { supabase } from '@/lib/supabase';
import { getDataBackend, apiJson } from '@/lib/backend';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import type { ProfileStatus, UserRole } from '@/types/core';

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

export interface NewUserInput {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  status?: ProfileStatus;
  phone?: string;
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
  if (getDataBackend() === 'demo') {
    const db = getMockDb();
    return {
      totalUsers: db.profiles.length,
      totalMothers: db.mothers.length,
      totalProfessionals: db.doctors.length,
      totalPrescriptions: db.prescriptions.length,
      totalAppointments: db.appointments.length,
      pendingDocuments: db.professional_documents.filter(d => d.status === 'pending').length,
      pendingProfessionals: db.doctors.filter(d => d.verification_status !== 'approved').length,
    };
  }
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
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    return db.profiles.map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role,
      status: p.status,
      created_at: '',
      avatar_url: p.avatar_url,
    }));
  }

  if (backend === 'postgres') {
    const { users } = await apiJson<{ users: UserProfile[] }>('/api/admin/users');
    return users;
  }

  // Supabase: lectura directa con las políticas RLS del admin
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[adminService] getAllUsers error:', error.message, error.details, error.hint);
    throw error;
  }
  return (data || []) as UserProfile[];
}

/**
 * Crear un usuario nuevo desde el panel de administración
 */
export async function createUser(input: NewUserInput): Promise<UserProfile> {
  if (getDataBackend() === 'demo') {
    const db = getMockDb();
    if (db.profiles.some(p => p.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error('Un usuario con este correo ya existe.');
    }
    const newId = `user-mock-${Date.now()}`;
    const profile = {
      id: newId,
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      status: input.status || 'approved' as ProfileStatus,
      phone: input.phone,
      password: input.password,
    };
    db.profiles.push(profile);
    if (input.role === 'mother') {
      db.mothers.push({ id: newId, phone: input.phone || '', birth_date: '', emergency_contact_name: '', emergency_contact_phone: '', blood_type: '' });
    } else if (input.role === 'obstetrician' || input.role === 'pediatrician') {
      db.doctors.push({
        id: newId,
        license_number: `LIC-${Math.floor(Math.random() * 100000)}`,
        specialty: input.role,
        phone: input.phone || '', clinic_address: '', consultation_hours: '',
        verification_status: 'approved',
        invite_code: `DR-${input.full_name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    }
    saveMockDb(db);
    return { ...profile, created_at: new Date().toISOString() };
  }

  const { user } = await apiJson<{ user: UserProfile }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return user;
}

/**
 * Resetear la contraseña de un usuario (acción de admin)
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  if (getDataBackend() === 'demo') {
    const db = getMockDb();
    const profile = db.profiles.find(p => p.id === userId);
    if (!profile) throw new Error('Usuario no encontrado.');
    profile.password = newPassword;
    saveMockDb(db);
    return;
  }

  await apiJson(`/api/admin/users/${userId}/password`, {
    method: 'POST',
    body: JSON.stringify({ password: newPassword }),
  });
}

function updateMockProfileStatus(userId: string, status: ProfileStatus) {
  const db = getMockDb();
  const profile = db.profiles.find(p => p.id === userId);
  if (profile) {
    profile.status = status;
    profile.is_suspended = status === 'suspended';
    saveMockDb(db);
  }
}

async function setUserStatus(userId: string, status: ProfileStatus, suspension_reason?: string | null): Promise<void> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    updateMockProfileStatus(userId, status);
    return;
  }

  if (backend === 'postgres') {
    await apiJson(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, suspension_reason: suspension_reason ?? null }),
    });
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status, suspension_reason: suspension_reason ?? null })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Actualizar el estado de un usuario
 */
export async function updateUserStatus(userId: string, status: string): Promise<void> {
  await setUserStatus(userId, status as ProfileStatus);
}

/**
 * Suspender a un usuario
 */
export async function suspendUser(userId: string, reason?: string): Promise<void> {
  await setUserStatus(userId, 'suspended', reason);
}

/**
 * Reactivar a un usuario
 */
export async function reactivateUser(userId: string): Promise<void> {
  await setUserStatus(userId, 'approved', null);
}

/**
 * Aprobar a un usuario
 */
export async function approveUser(userId: string): Promise<void> {
  await setUserStatus(userId, 'approved', null);
}

/**
 * Eliminar el perfil de un usuario
 */
export async function deleteUserProfile(userId: string): Promise<void> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    db.profiles = db.profiles.filter(p => p.id !== userId);
    saveMockDb(db);
    return;
  }

  if (backend === 'postgres') {
    await apiJson(`/api/admin/users/${userId}`, { method: 'DELETE' });
    return;
  }

  // Supabase: intentar primero por la API admin (borra también el usuario de Auth);
  // si el servidor no tiene service role, caer a borrar solo el perfil.
  try {
    await apiJson(`/api/admin/users/${userId}`, { method: 'DELETE' });
  } catch {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
  }
}

/**
 * Actualizar nombre y email de un usuario
 */
export async function updateUserProfile(userId: string, full_name: string, email: string): Promise<void> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    const profile = db.profiles.find(p => p.id === userId);
    if (profile) {
      profile.full_name = full_name;
      profile.email = email;
      saveMockDb(db);
    }
    return;
  }

  if (backend === 'postgres') {
    await apiJson(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ full_name, email }),
    });
    return;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, email })
    .eq('id', userId);
  if (error) throw error;
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
 * Cambiar el rol de un usuario
 */
export async function changeUserRole(userId: string, role: string): Promise<void> {
  if (getDataBackend() === 'demo') {
    const db = getMockDb();
    const profile = db.profiles.find(p => p.id === userId);
    if (profile) {
      profile.role = role as UserRole;
      saveMockDb(db);
    }
    return;
  }

  if (getDataBackend() === 'postgres') {
    await apiJson(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return;
  }

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
  details: Record<string, unknown>
): Promise<void> {
  if (getDataBackend() !== 'supabase') return;
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
