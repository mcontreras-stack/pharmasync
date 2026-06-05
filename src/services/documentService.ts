import { supabase } from '@/lib/supabase';

export interface ProfessionalDocument {
  id: string;
  doctor_id: string;
  type: 'id_front' | 'id_back' | 'degree' | 'exequatur' | 'colegiatura';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'needs_correction';
  notes?: string;
  created_at: string;
}

export interface MotherDocument {
  id: string;
  mother_id: string;
  type: 'id_front' | 'id_back' | 'pregnancy_cert' | 'birth_cert';
  file_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'needs_correction';
  notes?: string;
  created_at: string;
}

const PROFESSIONAL_BUCKET = 'professional-documents';
const MOTHER_BUCKET = 'mother-documents';

/**
 * Crear buckets si no existen
 */
export async function ensureBucketsExist(): Promise<void> {
  try {
    // Intentar crear bucket de documentos profesionales
    await supabase.storage.createBucket(PROFESSIONAL_BUCKET, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
  } catch (err: any) {
    if (err.message && !err.message.includes('already exists')) {
      console.error('Error creating professional bucket:', err);
    }
  }

  try {
    // Intentar crear bucket de documentos de madres
    await supabase.storage.createBucket(MOTHER_BUCKET, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
  } catch (err: any) {
    if (err.message && !err.message.includes('already exists')) {
      console.error('Error creating mother bucket:', err);
    }
  }
}

/**
 * Subir documento de profesional
 */
export async function uploadProfessionalDocument(
  doctorId: string,
  file: File,
  documentType: 'id_front' | 'id_back' | 'degree' | 'exequatur' | 'colegiatura'
): Promise<ProfessionalDocument> {
  try {
    // Asegurar que los buckets existen
    await ensureBucketsExist();

    // Generar nombre de archivo único
    const fileName = `${doctorId}/${documentType}/${Date.now()}-${file.name}`;

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PROFESSIONAL_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from(PROFESSIONAL_BUCKET)
      .getPublicUrl(uploadData.path);

    // Registrar documento en la base de datos
    const { data: docData, error: docError } = await supabase
      .from('professional_documents')
      .insert([
        {
          doctor_id: doctorId,
          type: documentType,
          file_url: publicUrlData.publicUrl,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (docError) throw docError;

    return docData as ProfessionalDocument;
  } catch (err) {
    console.error('Error uploading professional document:', err);
    throw err;
  }
}

/**
 * Subir documento de madre
 */
export async function uploadMotherDocument(
  motherId: string,
  file: File,
  documentType: 'id_front' | 'id_back' | 'pregnancy_cert' | 'birth_cert'
): Promise<MotherDocument> {
  try {
    // Asegurar que los buckets existen
    await ensureBucketsExist();

    // Generar nombre de archivo único
    const fileName = `${motherId}/${documentType}/${Date.now()}-${file.name}`;

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(MOTHER_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage
      .from(MOTHER_BUCKET)
      .getPublicUrl(uploadData.path);

    // Registrar documento en la base de datos
    const { data: docData, error: docError } = await supabase
      .from('mother_documents')
      .insert([
        {
          mother_id: motherId,
          type: documentType,
          file_url: publicUrlData.publicUrl,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (docError) throw docError;

    return docData as MotherDocument;
  } catch (err) {
    console.error('Error uploading mother document:', err);
    throw err;
  }
}

/**
 * Obtener documentos de un profesional
 */
export async function getProfessionalDocuments(doctorId: string): Promise<ProfessionalDocument[]> {
  try {
    const { data, error } = await supabase
      .from('professional_documents')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as ProfessionalDocument[];
  } catch (err) {
    console.error('Error fetching professional documents:', err);
    throw err;
  }
}

/**
 * Obtener documentos de una madre
 */
export async function getMotherDocuments(motherId: string): Promise<MotherDocument[]> {
  try {
    const { data, error } = await supabase
      .from('mother_documents')
      .select('*')
      .eq('mother_id', motherId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as MotherDocument[];
  } catch (err) {
    console.error('Error fetching mother documents:', err);
    throw err;
  }
}

/**
 * Actualizar estado de documento profesional
 */
export async function updateProfessionalDocumentStatus(
  documentId: string,
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'needs_correction',
  notes?: string
): Promise<ProfessionalDocument> {
  try {
    const { data, error } = await supabase
      .from('professional_documents')
      .update({ status, notes })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;

    return data as ProfessionalDocument;
  } catch (err) {
    console.error('Error updating professional document status:', err);
    throw err;
  }
}

/**
 * Actualizar estado de documento de madre
 */
export async function updateMotherDocumentStatus(
  documentId: string,
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'needs_correction',
  notes?: string
): Promise<MotherDocument> {
  try {
    const { data, error } = await supabase
      .from('mother_documents')
      .update({ status, notes })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;

    return data as MotherDocument;
  } catch (err) {
    console.error('Error updating mother document status:', err);
    throw err;
  }
}

/**
 * Eliminar documento profesional
 */
export async function deleteProfessionalDocument(documentId: string, filePath: string): Promise<void> {
  try {
    // Eliminar archivo del storage
    const { error: storageError } = await supabase.storage
      .from(PROFESSIONAL_BUCKET)
      .remove([filePath]);

    if (storageError) throw storageError;

    // Eliminar registro de la base de datos
    const { error: dbError } = await supabase
      .from('professional_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;
  } catch (err) {
    console.error('Error deleting professional document:', err);
    throw err;
  }
}

/**
 * Eliminar documento de madre
 */
export async function deleteMotherDocument(documentId: string, filePath: string): Promise<void> {
  try {
    // Eliminar archivo del storage
    const { error: storageError } = await supabase.storage
      .from(MOTHER_BUCKET)
      .remove([filePath]);

    if (storageError) throw storageError;

    // Eliminar registro de la base de datos
    const { error: dbError } = await supabase
      .from('mother_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;
  } catch (err) {
    console.error('Error deleting mother document:', err);
    throw err;
  }
}

/**
 * Obtener documentos pendientes de revisión (para admins)
 */
export async function getPendingDocuments(): Promise<(ProfessionalDocument | MotherDocument)[]> {
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

    return [...(profDocs || []), ...(motherDocs || [])] as (ProfessionalDocument | MotherDocument)[];
  } catch (err) {
    console.error('Error fetching pending documents:', err);
    throw err;
  }
}
