'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, Doctor } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';
import {
  Check,
  X,
  Clock,
  FileText,
  MessageSquare,
  UserCheck,
  Lock,
  FileSearch
} from 'lucide-react';
import DoctorActionModal from './DoctorActionModal';
import DocumentObsModal from './DocumentObsModal';
import DoctorVerificationArchive from './DoctorVerificationArchive';

export default function DoctorVerification() {
  const { adminSubRole } = useAuth();
  const [db, setDb] = useState(getMockDb());
  
  // Modals / Input states
  const [activeDoctorAction, setActiveDoctorAction] = useState<{ docId: string; type: 'reject' | 'corrections' } | null>(null);

  // Individual Doc rejection modal state
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [docNotes, setDocNotes] = useState('');

  // Calculations
  const pendingDocs = db.doctors.filter(d => d.verification_status === 'pending');
  const otherDocs = db.doctors.filter(d => d.verification_status !== 'pending');

  const handleStatusChange = React.useCallback((doctorId: string, nextStatus: 'approved' | 'rejected' | 'pending_corrections', note: string) => {
    const updatedDoctors = db.doctors.map(d => {
      if (d.id === doctorId) {
        const historyEntry = {
          status: nextStatus,
          note: note || 'Cambio de estado sin comentarios adicionales.',
          date: new Date().toISOString()
        };
        const currentHistory = d.verification_history || [];
        return {
          ...d,
          verification_status: nextStatus,
          verification_history: [historyEntry, ...currentHistory]
        };
      }
      return d;
    });

    // Update global profile status as well
    const updatedProfiles = db.profiles.map(p => {
      if (p.id === doctorId) {
        let status: 'approved' | 'rejected' | 'under_review' = 'under_review';
        if (nextStatus === 'approved') status = 'approved';
        if (nextStatus === 'rejected') status = 'rejected';
        return { ...p, status };
      }
      return p;
    });

    // Send in-app notification to the doctor
    const docProfile = db.profiles.find(p => p.id === doctorId);
    let updatedNotifications = db.notifications;

    if (docProfile) {
      let title = '';
      let content = '';
      if (nextStatus === 'approved') {
        title = '¡Licencia Verificada con Éxito! 🎉';
        content = 'Tu exequátur y credenciales han sido validadas. Ya puedes iniciar consultas médicas.';
      } else if (nextStatus === 'rejected') {
        title = 'Solicitud de Validación Rechazada';
        content = `Lo sentimos, tus credenciales han sido rechazadas. Motivo: ${note}`;
      } else {
        title = 'Correcciones requeridas en tu registro';
        content = `Se requiere corregir la documentación: ${note}. Por favor, vuelve a subir tus archivos.`;
      }

      const newNotification = {
        id: `not-${Date.now()}`,
        user_id: doctorId,
        title,
        content,
        type: 'system' as const,
        created_at: new Date().toISOString()
      };
      
      updatedNotifications = [newNotification, ...db.notifications];
    }

    const updatedDb = {
      ...db,
      profiles: updatedProfiles,
      doctors: updatedDoctors,
      notifications: updatedNotifications
    };
    
    setDb(updatedDb);
    saveMockDb(updatedDb);
    setActiveDoctorAction(null);
  }, [db]);

  const handleDocumentStatusChange = (docId: string, nextStatus: 'approved' | 'rejected', notes?: string) => {
    const updatedDocs = (db.professional_documents || []).map(doc => {
      if (doc.id === docId) {
        return { ...doc, status: nextStatus, notes: notes || '' };
      }
      return doc;
    });

    const updatedDb = {
      ...db,
      professional_documents: updatedDocs
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setRejectingDocId(null);
    setDocNotes('');
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'id_front': return 'Cédula de Identidad (Frente)';
      case 'id_back': return 'Cédula de Identidad (Reverso)';
      case 'degree': return 'Título de Grado Universitario';
      case 'exequatur': return 'Certificación de Exequátur SNS';
      case 'colegiatura': return 'Carnet Colegiatura Médica';
      default: return type;
    }
  };

  // Check if admin has edit/verification permissions
  const canVerifyDocuments = ['superadmin', 'admin', 'verificador_documental'].includes(adminSubRole);
  const canObserveQuality = ['superadmin', 'admin', 'calidad'].includes(adminSubRole);

  return (
    <div className="space-y-6">
      {/* Role permission info banner */}
      <div className="bg-slate-50 border border-gray-150 p-4 rounded-2xl flex items-center justify-between text-xs text-slate-650">
        <div>
          <span className="font-bold text-slate-800">Permisos Activos de Operaciones:</span>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-550 font-medium">
            <li>Revisar cola de credenciales médicas: <span className="text-emerald-600 font-bold">Sí</span></li>
            <li>Añadir observaciones de calidad técnica: {canObserveQuality ? <span className="text-emerald-600 font-bold">Sí</span> : <span className="text-rose-500">No (Solo Calidad/Superadmin)</span>}</li>
            <li>Aprobar/Rechazar archivos y credenciales finales: {canVerifyDocuments ? <span className="text-emerald-600 font-bold">Sí</span> : <span className="text-rose-500">No (Solo Verificador/Superadmin)</span>}</li>
          </ul>
        </div>
        <FileSearch className="h-10 w-10 text-slate-400 shrink-0 hidden sm:block" />
      </div>

      {/* 1. PENDING QUEUE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500 shrink-0" />
          Cola de Espera (Aprobación Pendiente)
        </h3>
        <p className="text-[10px] text-gray-400">Verifique las imágenes e ingrese los veredictos de exequátur oficial antes de autorizar las cuentas médicas.</p>

        <div className="divide-y divide-gray-100">
          {pendingDocs.length === 0 ? (
            <div className="py-10 text-center text-gray-400 font-medium text-xs flex flex-col items-center gap-2">
              <UserCheck className="h-8 w-8 text-emerald-500 animate-bounce" />
              ¡Excelente! No hay médicos en la cola de revisión.
            </div>
          ) : (
            pendingDocs.map(doc => {
              const profile = db.profiles.find(p => p.id === doc.id);
              if (!profile) return null;

              // Filter documents for this doctor
              const docsList = (db.professional_documents || []).filter(d => d.doctor_id === doc.id);
              const allDocsApproved = docsList.length > 0 && docsList.every(d => d.status === 'approved');

              return (
                <div key={doc.id} className="py-6 flex flex-col gap-5">
                  {/* Doctor Info Header */}
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 text-slate-700 font-black flex items-center justify-center border border-slate-200 rounded-2xl uppercase shrink-0">
                          {profile.full_name.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">{profile.full_name}</h4>
                          <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">{profile.email} • Tel: {doc.phone || 'No provisto'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 p-3 rounded-2xl border border-gray-100 text-[10px] font-semibold text-slate-600">
                        <div>
                          <span className="text-gray-400 font-bold uppercase tracking-wider block text-[8px] mb-0.5">Especialidad</span>
                          <span className="capitalize">{doc.specialty === 'obstetrician' ? 'Obstetricia' : 'Pediatría'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold uppercase tracking-wider block text-[8px] mb-0.5">Exequátur N°</span>
                          <span className="font-mono">{doc.exequatur || doc.license_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold uppercase tracking-wider block text-[8px] mb-0.5">Cédula Identidad</span>
                          <span>{doc.national_id || 'Ver Documentos'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold uppercase tracking-wider block text-[8px] mb-0.5">Dirección Clínica</span>
                          <span className="truncate block" title={doc.clinic_address}>{doc.clinic_address || 'No cargado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Final Action buttons */}
                    <div className="flex items-center gap-2 lg:self-center shrink-0">
                      {canVerifyDocuments ? (
                        <button
                          onClick={() => handleStatusChange(doc.id, 'approved', 'Exequátur oficial y documentos auditados correctamente.')}
                          disabled={!allDocsApproved}
                          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold shadow-xs transition-colors text-white ${allDocsApproved ? 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                          <Check className="h-4 w-4" />
                          Aprobar Cuenta
                        </button>
                      ) : (
                        <div className="text-[10px] text-rose-500 bg-rose-50 border border-rose-100 p-2 rounded-xl flex items-center gap-1 font-bold">
                          <Lock className="h-3 w-3" /> Solo Verificadores pueden aprobar
                        </div>
                      )}

                      <button
                        onClick={() => setActiveDoctorAction({ docId: doc.id, type: 'corrections' })}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl hover:bg-amber-100 text-[10px] font-bold transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Requerir Cambios
                      </button>

                      {canVerifyDocuments && (
                        <button
                          onClick={() => setActiveDoctorAction({ docId: doc.id, type: 'reject' })}
                          className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 text-[10px] font-bold transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          Rechazar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Individual Documents Checklist */}
                  <div className="bg-slate-50/30 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Lista de Documentación Requerida</span>
                    
                    {docsList.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic">No se han subido archivos adjuntos para este médico.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {docsList.map(file => (
                          <div key={file.id} className="bg-white border border-gray-150 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="text-[10px] font-extrabold text-slate-700">{getDocTypeLabel(file.type)}</h5>
                                <a 
                                  href={file.file_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[9px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold inline-flex items-center gap-1 mt-0.5"
                                >
                                  <FileText className="h-3 w-3" /> Inspeccionar Archivo Original
                                </a>
                              </div>

                              {/* Status Badge */}
                              <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${file.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : file.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {file.status === 'approved' ? 'Aceptado' : file.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                              </span>
                            </div>

                            {file.notes && (
                              <p className="text-[9px] bg-slate-550/5 border border-slate-100 text-gray-500 font-medium p-1.5 rounded-lg leading-normal">
                                <span className="font-bold text-slate-700">Observación:</span> {file.notes}
                              </p>
                            )}

                            {/* Document Actions Buttons */}
                            <div className="flex gap-2 justify-end border-t border-gray-50 pt-2">
                              {canObserveQuality && file.status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingDocId(file.id);
                                    setDocNotes(file.notes || '');
                                  }}
                                  className="px-2 py-1 border border-gray-200 text-slate-500 rounded-lg text-[9px] font-bold hover:bg-gray-50 flex items-center gap-1"
                                >
                                  <MessageSquare className="h-3 w-3" /> {file.notes ? 'Editar Nota' : 'Añadir Observación'}
                                </button>
                              )}

                              {canVerifyDocuments && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleDocumentStatusChange(file.id, 'approved')}
                                    className={`p-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-colors ${file.status === 'approved' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                                  >
                                    <Check className="h-3.5 w-3.5" /> Aceptar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingDocId(file.id);
                                      setDocNotes(file.notes || '');
                                    }}
                                    className={`p-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-colors ${file.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                                  >
                                    <X className="h-3.5 w-3.5" /> Rechazar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. REGISTRATION ARCHIVE / OTHER STATES */}
      <DoctorVerificationArchive otherDocs={otherDocs} profiles={db.profiles} />

      {/* MODAL DIALOGUE: REJECT OR REQUEST CORRECTIONS FOR WHOLE DOCTOR */}
      <DoctorActionModal
        action={activeDoctorAction}
        onClose={() => setActiveDoctorAction(null)}
        onSubmit={handleStatusChange}
      />

      {/* MODAL DIALOGUE: REJECT INDIVIDUAL DOCUMENT OR EDIT OBSERVATION */}
      <DocumentObsModal
        documentId={rejectingDocId}
        initialNotes={docNotes}
        onClose={() => setRejectingDocId(null)}
        onSubmit={(docId, notes) => handleDocumentStatusChange(docId, 'rejected', notes)}
      />
    </div>
  );
}
