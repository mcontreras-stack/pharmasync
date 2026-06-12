import { supabase } from '@/lib/supabase';
import { getDataBackend, apiJson } from '@/lib/backend';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import type { Doctor, Pregnancy, Mother, Baby } from '@/types/core';

/**
 * Vinculación madre ↔ médico, disponible en los tres backends
 * (demo/mock, Supabase y PostgreSQL vía /api).
 *
 * Estados a nivel de app: 'pending' | 'active' | 'inactive'
 * Estados en BD real:     'pending' | 'accepted' | 'rejected' | 'revoked'
 */

export type LinkAppStatus = 'pending' | 'active' | 'inactive';

export interface PatientLink {
  id: string;
  doctor_id: string;
  mother_id: string;
  status: LinkAppStatus;
  link_code?: string;
  doctor_name?: string;
  specialty?: 'obstetrician' | 'pediatrician';
  license_number?: string;
  mother_name?: string;
}

export interface ObstetricPatient {
  motherId: string;
  full_name: string;
  mother: Mother | null;
  pregnancy: Pregnancy | null;
}

export interface PediatricPatient {
  baby: Baby;
  mother_name: string;
}

function dbToAppStatus(status: string): LinkAppStatus {
  if (status === 'accepted' || status === 'active') return 'active';
  if (status === 'pending') return 'pending';
  return 'inactive';
}

// ─── Vínculos de la madre ──────────────────────────────────────────────────

export async function getLinksForMother(motherId: string): Promise<PatientLink[]> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    return (db.doctor_patient_links || [])
      .filter(l => l.mother_id === motherId)
      .map(l => {
        const doc = db.doctors.find(d => d.id === l.doctor_id);
        const profile = db.profiles.find(p => p.id === l.doctor_id);
        return {
          id: l.id,
          doctor_id: l.doctor_id,
          mother_id: l.mother_id,
          status: dbToAppStatus(l.status),
          link_code: l.link_code,
          doctor_name: profile?.full_name,
          specialty: doc?.specialty,
          license_number: doc?.license_number,
        };
      });
  }

  if (backend === 'postgres') {
    const { links } = await apiJson<{ links: Array<PatientLink & { status: string }> }>(`/api/links?motherId=${motherId}`);
    return links.map(l => ({ ...l, status: dbToAppStatus(l.status) }));
  }

  const { data: links, error } = await supabase
    .from('doctor_patient_links')
    .select('*')
    .eq('mother_id', motherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!links || links.length === 0) return [];

  const doctorIds = [...new Set(links.map(l => l.doctor_id))];
  const [{ data: profiles }, { data: professionals }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').in('id', doctorIds),
    supabase.from('professionals').select('id, specialty, exequatur').in('id', doctorIds),
  ]);

  return links.map(l => {
    const profile = profiles?.find(p => p.id === l.doctor_id);
    const prof = professionals?.find(p => p.id === l.doctor_id);
    return {
      id: l.id,
      doctor_id: l.doctor_id,
      mother_id: l.mother_id,
      status: dbToAppStatus(l.status),
      link_code: l.link_code,
      doctor_name: profile?.full_name,
      specialty: prof?.specialty,
      license_number: prof?.exequatur,
    };
  });
}

/** Solicitar vínculo con un médico por su código de invitación. */
export async function requestLink(motherId: string, code: string): Promise<{ success: boolean; message: string }> {
  const backend = getDataBackend();
  const cleanCode = code.toUpperCase().trim();

  if (backend === 'demo') {
    const db = getMockDb();
    const targetDoc = db.doctors.find(d =>
      (d.invite_code && d.invite_code.toUpperCase() === cleanCode) ||
      (d.id === 'doctor-ana-456' && cleanCode === 'OB-ANA-28') ||
      (d.id === 'doctor-andres-789' && cleanCode === 'PE-AND-04')
    );
    if (!targetDoc) return { success: false, message: 'Código de invitación no encontrado.' };

    const exists = (db.doctor_patient_links || []).some(lnk =>
      lnk.doctor_id === targetDoc.id && lnk.mother_id === motherId && lnk.status !== 'inactive'
    );
    if (exists) return { success: false, message: 'Ya tienes una vinculación activa con este especialista.' };

    db.doctor_patient_links = [...(db.doctor_patient_links || []), {
      id: `lnk-${Date.now()}`,
      doctor_id: targetDoc.id,
      mother_id: motherId,
      link_code: cleanCode,
      status: 'pending' as const,
    }];
    saveMockDb(db);
    return { success: true, message: 'Vínculo solicitado correctamente. Pendiente de aprobación.' };
  }

  if (backend === 'postgres') {
    try {
      const res = await apiJson<{ doctor_name: string }>('/api/links', {
        method: 'POST',
        body: JSON.stringify({ code: cleanCode, mother_id: motherId }),
      });
      return { success: true, message: `Vínculo solicitado a ${res.doctor_name}. Pendiente de aprobación.` };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'No se pudo solicitar el vínculo.' };
    }
  }

  // Supabase
  const { data: prof, error: profErr } = await supabase
    .from('professionals')
    .select('id, specialty')
    .ilike('invite_code', cleanCode)
    .maybeSingle();
  if (profErr || !prof) return { success: false, message: 'Código de invitación no encontrado.' };

  const { data: existing } = await supabase
    .from('doctor_patient_links')
    .select('id')
    .eq('doctor_id', prof.id)
    .eq('mother_id', motherId)
    .in('status', ['pending', 'accepted']);
  if (existing && existing.length > 0) {
    return { success: false, message: 'Ya tienes una vinculación activa con este especialista.' };
  }

  await supabase.from('mothers').upsert({ id: motherId });
  const { error: insErr } = await supabase
    .from('doctor_patient_links')
    .insert({ doctor_id: prof.id, mother_id: motherId, link_code: cleanCode, status: 'pending' });
  if (insErr) return { success: false, message: insErr.message };
  return { success: true, message: 'Vínculo solicitado correctamente. Pendiente de aprobación.' };
}

// ─── Aprobación / revocación ────────────────────────────────────────────────

async function applyLinkAssignment(action: 'approve' | 'reject' | 'revoke', link: { doctor_id: string; mother_id: string }, specialty?: string) {
  // Asignar o liberar el embarazo/bebés según la especialidad (Supabase)
  if (action === 'approve') {
    if (specialty === 'obstetrician') {
      await supabase.from('pregnancies')
        .update({ obstetrician_id: link.doctor_id })
        .eq('mother_id', link.mother_id)
        .eq('status', 'active');
    } else if (specialty === 'pediatrician') {
      await supabase.from('babies')
        .update({ pediatrician_id: link.doctor_id })
        .eq('mother_id', link.mother_id);
    }
  } else {
    if (specialty === 'obstetrician') {
      await supabase.from('pregnancies')
        .update({ obstetrician_id: null })
        .eq('mother_id', link.mother_id)
        .eq('obstetrician_id', link.doctor_id);
    } else if (specialty === 'pediatrician') {
      await supabase.from('babies')
        .update({ pediatrician_id: null })
        .eq('mother_id', link.mother_id)
        .eq('pediatrician_id', link.doctor_id);
    }
  }
}

/** Aprobar (médico), rechazar (médico) o revocar (madre) un vínculo. */
export async function setLinkStatus(linkId: string, action: 'approve' | 'reject' | 'revoke'): Promise<void> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    const link = db.doctor_patient_links.find(l => l.id === linkId);
    if (!link) return;
    const doc = db.doctors.find(d => d.id === link.doctor_id);

    const nextStatus = action === 'approve' ? 'active' as const : 'inactive' as const;
    db.doctor_patient_links = db.doctor_patient_links.map(l => l.id === linkId ? { ...l, status: nextStatus } : l);

    if (action === 'approve') {
      if (doc?.specialty === 'obstetrician') {
        db.pregnancies = db.pregnancies.map(p => p.mother_id === link.mother_id && p.status === 'active' ? { ...p, obstetrician_id: link.doctor_id } : p);
      } else if (doc?.specialty === 'pediatrician') {
        db.babies = db.babies.map(b => b.mother_id === link.mother_id ? { ...b, pediatrician_id: link.doctor_id } : b);
      }
    } else {
      if (doc?.specialty === 'obstetrician') {
        db.pregnancies = db.pregnancies.map(p => p.mother_id === link.mother_id && p.obstetrician_id === link.doctor_id ? { ...p, obstetrician_id: null } : p);
      } else if (doc?.specialty === 'pediatrician') {
        db.babies = db.babies.map(b => b.mother_id === link.mother_id && b.pediatrician_id === link.doctor_id ? { ...b, pediatrician_id: null } : b);
      }
    }
    saveMockDb(db);
    return;
  }

  if (backend === 'postgres') {
    await apiJson('/api/links', { method: 'PATCH', body: JSON.stringify({ id: linkId, action }) });
    return;
  }

  // Supabase
  const { data: link, error } = await supabase
    .from('doctor_patient_links')
    .select('doctor_id, mother_id')
    .eq('id', linkId)
    .single();
  if (error || !link) throw error || new Error('Vínculo no encontrado.');

  const { data: prof } = await supabase
    .from('professionals')
    .select('specialty')
    .eq('id', link.doctor_id)
    .maybeSingle();

  const newStatus = action === 'approve' ? 'accepted' : action === 'reject' ? 'rejected' : 'revoked';
  const { error: updErr } = await supabase
    .from('doctor_patient_links')
    .update({ status: newStatus })
    .eq('id', linkId);
  if (updErr) throw updErr;

  await applyLinkAssignment(action, link, prof?.specialty);
}

// ─── Lado del médico ────────────────────────────────────────────────────────

export async function getPendingLinksForDoctor(doctorId: string): Promise<PatientLink[]> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    return (db.doctor_patient_links || [])
      .filter(l => l.doctor_id === doctorId && l.status === 'pending')
      .map(l => ({
        id: l.id,
        doctor_id: l.doctor_id,
        mother_id: l.mother_id,
        status: 'pending' as const,
        link_code: l.link_code,
        mother_name: db.profiles.find(p => p.id === l.mother_id)?.full_name,
      }));
  }

  if (backend === 'postgres') {
    const { links } = await apiJson<{ links: Array<PatientLink & { status: string }> }>(`/api/links?doctorId=${doctorId}&status=pending`);
    return links.map(l => ({ ...l, status: dbToAppStatus(l.status) }));
  }

  const { data: links, error } = await supabase
    .from('doctor_patient_links')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('status', 'pending');
  if (error) throw error;
  if (!links || links.length === 0) return [];

  const motherIds = [...new Set(links.map(l => l.mother_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', motherIds);

  return links.map(l => ({
    id: l.id,
    doctor_id: l.doctor_id,
    mother_id: l.mother_id,
    status: 'pending' as const,
    link_code: l.link_code,
    mother_name: profiles?.find(p => p.id === l.mother_id)?.full_name,
  }));
}

/** Roster del obstetra: madres con embarazo activo asignado. */
export async function getObstetricPatients(doctorId: string): Promise<ObstetricPatient[]> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    return db.mothers
      .filter(m => db.pregnancies.some(p => p.mother_id === m.id && p.obstetrician_id === doctorId))
      .map(m => ({
        motherId: m.id,
        full_name: db.profiles.find(p => p.id === m.id)?.full_name || '',
        mother: m,
        pregnancy: db.pregnancies.find(p => p.mother_id === m.id && p.status === 'active') || null,
      }));
  }

  if (backend === 'postgres') {
    type Row = Mother & { full_name: string; pregnancy_id: string; last_menstrual_period: string; estimated_due_date: string; pregnancy_status: string };
    const { patients } = await apiJson<{ patients: Row[] }>('/api/patients');
    return patients.map(r => ({
      motherId: r.id,
      full_name: r.full_name,
      mother: r,
      pregnancy: {
        id: r.pregnancy_id,
        mother_id: r.id,
        obstetrician_id: doctorId,
        status: 'active' as const,
        last_menstrual_period: r.last_menstrual_period,
        estimated_due_date: r.estimated_due_date,
        weeks_gestation_offset: 0,
      },
    }));
  }

  const { data: pregnancies, error } = await supabase
    .from('pregnancies')
    .select('*')
    .eq('obstetrician_id', doctorId)
    .eq('status', 'active');
  if (error) throw error;
  if (!pregnancies || pregnancies.length === 0) return [];

  const motherIds = [...new Set(pregnancies.map(p => p.mother_id))];
  const [{ data: mothers }, { data: profiles }] = await Promise.all([
    supabase.from('mothers').select('*').in('id', motherIds),
    supabase.from('profiles').select('id, full_name').in('id', motherIds),
  ]);

  return pregnancies.map(preg => ({
    motherId: preg.mother_id,
    full_name: profiles?.find(p => p.id === preg.mother_id)?.full_name || '',
    mother: mothers?.find(m => m.id === preg.mother_id) || null,
    pregnancy: preg,
  }));
}

/** Roster del pediatra: bebés asignados. */
export async function getPediatricPatients(doctorId: string): Promise<PediatricPatient[]> {
  const backend = getDataBackend();

  if (backend === 'demo') {
    const db = getMockDb();
    return db.babies
      .filter(b => b.pediatrician_id === doctorId)
      .map(b => ({
        baby: b,
        mother_name: db.profiles.find(p => p.id === b.mother_id)?.full_name || '',
      }));
  }

  if (backend === 'postgres') {
    type Row = Baby & { mother_name: string };
    const { patients } = await apiJson<{ patients: Row[] }>('/api/patients');
    return patients.map(r => ({ baby: r, mother_name: r.mother_name }));
  }

  const { data: babies, error } = await supabase
    .from('babies')
    .select('*')
    .eq('pediatrician_id', doctorId);
  if (error) throw error;
  if (!babies || babies.length === 0) return [];

  const motherIds = [...new Set(babies.map(b => b.mother_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', motherIds);

  return babies.map(b => ({
    baby: b,
    mother_name: profiles?.find(p => p.id === b.mother_id)?.full_name || '',
  }));
}

/** Ficha profesional del médico (genera invite_code si falta). */
export async function getMyProfessional(userId: string, fullName: string): Promise<Partial<Doctor>> {
  const backend = getDataBackend();

  const generateCode = () =>
    `DR-${(fullName.split(' ')[0] || 'DOC').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'DOC'}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (backend === 'demo') {
    const db = getMockDb();
    let doc = db.doctors.find(d => d.id === userId);
    if (doc && !doc.invite_code) {
      doc = { ...doc, invite_code: generateCode() };
      db.doctors = db.doctors.map(d => d.id === userId ? doc! : d);
      saveMockDb(db);
    }
    return doc || {};
  }

  if (backend === 'postgres') {
    const { professional } = await apiJson<{ professional: { invite_code?: string; exequatur?: string; colegiatura?: string } | null }>('/api/professionals/me');
    return professional ? {
      invite_code: professional.invite_code,
      exequatur: professional.exequatur,
      colegiatura: professional.colegiatura,
      license_number: professional.exequatur,
    } as Partial<Doctor> : {};
  }

  const { data: prof } = await supabase.from('professionals').select('*').eq('id', userId).maybeSingle();
  if (prof && !prof.invite_code) {
    const code = generateCode();
    await supabase.from('professionals').update({ invite_code: code }).eq('id', userId);
    return { ...prof, invite_code: code, license_number: prof.exequatur };
  }
  return prof ? { ...prof, license_number: prof.exequatur } : {};
}
