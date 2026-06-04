'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Prescription, PrescriptionItem, MOCK_MOTHER_ID } from '@/lib/mockDb';
import { 
  FileText, 
  Plus, 
  Printer, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Calendar, 
  FileCheck,
  Eye,
  Lock,
  ArrowRight,
  Stethoscope,
  X
} from 'lucide-react';

export default function PrescriptionsTab() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  
  // States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form states
  const [selectedMotherId, setSelectedMotherId] = useState('');
  const [selectedBabyId, setSelectedBabyId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [isControlled, setIsControlled] = useState(false);
  
  // Item form states
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      generic_name: '',
      commercial_name: '',
      concentration: '',
      pharmaceutical_form: 'Tabletas',
      presentation: 'Caja',
      dose: '1 tableta',
      route: 'Vía oral',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      quantity: 1,
      instructions: ''
    }
  ]);

  if (!user) return null;

  const isDoctor = user.role === 'obstetrician' || user.role === 'pediatrician';
  const doctor = db.doctors.find(d => d.id === user.id) || {
    clinic_address: 'Santo Domingo, Rep. Dominicana',
    phone: '',
    exequatur: 'EQ-0000',
    specialty: 'obstetrician'
  };

  // Queries
  const prescriptionsList = isDoctor 
    ? (db.prescriptions || []).filter(p => p.doctor_id === user.id)
    : (db.prescriptions || []).filter(p => p.mother_id === user.id);

  // Connected patients for form
  const connectedMothers = db.mothers.map(m => {
    const profile = db.profiles.find(p => p.id === m.id);
    const babiesList = db.babies.filter(b => b.mother_id === m.id && b.pediatrician_id === user.id);
    const linked = db.doctor_patient_links.some(lnk => lnk.mother_id === m.id && lnk.doctor_id === user.id && lnk.status === 'active');
    
    // For obstetrician, check pregnancy links
    const obsLinked = db.pregnancies.some(p => p.mother_id === m.id && p.obstetrician_id === user.id);

    if (linked || obsLinked || babiesList.length > 0) {
      return {
        id: m.id,
        name: profile?.full_name || 'Paciente',
        age: 28,
        allergies: m.allergies || 'Ninguna',
        babies: babiesList
      };
    }
    return null;
  }).filter(Boolean);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        generic_name: '',
        commercial_name: '',
        concentration: '',
        pharmaceutical_form: 'Tabletas',
        presentation: 'Caja',
        dose: '1 tableta',
        route: 'Vía oral',
        frequency: 'Cada 8 horas',
        duration: '7 días',
        quantity: 1,
        instructions: ''
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updated = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updated);
  };

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMotherId) return;

    const patient = connectedMothers.find(m => m?.id === selectedMotherId);
    if (!patient) return;

    let patientName = patient.name;
    let babyId: string | undefined = undefined;

    if (user.role === 'pediatrician' && selectedBabyId) {
      const baby = patient.babies.find(b => b.id === selectedBabyId);
      if (baby) {
        patientName = `${baby.name} (Hijo/a de ${patient.name})`;
        babyId = baby.id;
      }
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Valid for 30 days

    const newPres: Prescription = {
      id: `pres-${Date.now()}`,
      doctor_id: user.id,
      mother_id: selectedMotherId,
      baby_id: babyId,
      diagnosis,
      is_controlled: isControlled,
      status: 'active',
      code: `REC-${Math.floor(1000000 + Math.random() * 9000000)}`,
      expiry_date: expiryDate.toISOString(),
      created_at: new Date().toISOString(),
      doctor_name: user.full_name,
      doctor_specialty: user.role === 'obstetrician' ? 'Obstetricia & Ginecología' : 'Pediatría',
      doctor_exequatur: doctor.exequatur || 'EQ-00000',
      doctor_address: doctor.clinic_address || 'Dirección no provista',
      doctor_phone: doctor.phone || '809-555-0199',
      patient_name: patientName,
      patient_age: patient.age,
      patient_allergies: patient.allergies,
      items: items.filter(item => item.generic_name.trim() !== '')
    };

    // Save
    const updatedDb = {
      ...db,
      prescriptions: [newPres, ...(db.prescriptions || [])]
    };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    // Close modal
    setShowCreateModal(false);
    
    // Reset forms
    setSelectedMotherId('');
    setSelectedBabyId('');
    setDiagnosis('');
    setIsControlled(false);
    setItems([
      {
        generic_name: '',
        commercial_name: '',
        concentration: '',
        pharmaceutical_form: 'Tabletas',
        presentation: 'Caja',
        dose: '1 tableta',
        route: 'Vía oral',
        frequency: 'Cada 8 horas',
        duration: '7 días',
        quantity: 1,
        instructions: ''
      }
    ]);
  };

  const triggerPrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'dispensed': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-slate-100 text-slate-500';
      case 'canceled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Vigente';
      case 'dispensed': return 'Dispensada';
      case 'expired': return 'Vencida';
      case 'canceled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      
      {/* Print Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
          }
          
          /* Force page background to white and text to black */
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Prevent layout clipping from scrollable wrappers */
          div, main {
            overflow: visible !important;
            height: auto !important;
          }

          /* Disable animations, transitions, and opacity/filter changes that hide elements */
          * {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            filter: none !important;
            backdrop-filter: none !important;
          }

          /* Hide layout elements completely */
          header, aside, nav, footer, .print\\:hidden {
            display: none !important;
          }

          /* Hide everything in the document body */
          body * {
            visibility: hidden;
          }

          /* Make only the prescription area and its descendants visible */
          #print-prescription-area, #print-prescription-area * {
            visibility: visible !important;
          }

          /* Position the print area to take up the entire printable page */
          #print-prescription-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            z-index: 99999999 !important;
            padding: 20mm !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
          }
        }
      `}} />

      {/* Header section */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Recetario Digital</h2>
          <p className="text-xs text-gray-500 mt-1">
            {isDoctor 
              ? 'Emisión y archivo de prescripciones farmacológicas firmadas digitalmente.' 
              : 'Historial de recetas farmacológicas autorizadas por tus médicos de cabecera.'
            }
          </p>
        </div>

        {isDoctor && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="h-4.5 w-4.5" /> Emitir Receta Médica
          </button>
        )}
      </div>

      {/* Prescriptions list grid */}
      <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm space-y-4 print:hidden">
        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <FileText className="h-5 w-5 text-pink-500" />
          {isDoctor ? 'Historial de Recetas Emitidas' : 'Mis Prescripciones Recibidas'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Paciente/Médico</th>
                <th className="py-3 px-4">Diagnóstico</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4">Medicamentos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {prescriptionsList.length > 0 ? (
                prescriptionsList.map(pres => (
                  <tr key={pres.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-700">{pres.code}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-700">{isDoctor ? pres.patient_name : pres.doctor_name}</p>
                      <span className="text-[9px] text-gray-400 block mt-0.5">{isDoctor ? 'Paciente' : pres.doctor_specialty}</span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-650 truncate max-w-[150px]" title={pres.diagnosis}>{pres.diagnosis || 'Control prenatal general'}</td>
                    <td className="py-4 px-4 font-semibold text-gray-500">{new Date(pres.created_at).toLocaleDateString('es-ES')}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-750">
                        {pres.items.map(item => item.generic_name).join(', ')}
                      </p>
                      <span className="text-[9px] text-pink-600 font-semibold">{pres.items.length} fármacos</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${getStatusBadge(pres.status)}`}>
                        {getStatusLabel(pres.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => {
                          setActivePrescription(pres);
                          setShowPrintModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-950 text-white rounded-lg hover:bg-slate-950 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver e Imprimir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-450 italic font-semibold">
                    No se han registrado prescripciones clínicas en este perfil.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW PRESCRIPTION MODAL */}
      {showCreateModal && isDoctor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-2xl border border-gray-100 shadow-xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-pink-500" /> Emitir Prescripción Médica Oficial
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Garantiza el cumplimiento de las normativas de salud del SNS dominicano.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 rounded-full"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Mother */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Seleccionar Paciente / Madre</label>
                  <select
                    value={selectedMotherId}
                    onChange={(e) => {
                      setSelectedMotherId(e.target.value);
                      setSelectedBabyId('');
                    }}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none"
                    required
                  >
                    <option value="">-- Elige Paciente --</option>
                    {connectedMothers.map(m => m && (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Select Baby (for pediatricians) */}
                {user.role === 'pediatrician' && selectedMotherId && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Seleccionar Niño / Bebé</label>
                    <select
                      value={selectedBabyId}
                      onChange={(e) => setSelectedBabyId(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="">-- Elige Bebé (Opcional - Receta para la Madre) --</option>
                      {connectedMothers.find(m => m?.id === selectedMotherId)?.babies.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Diagnosis */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Diagnóstico Clínico (CIE-10)</label>
                <input
                  type="text"
                  placeholder="Ej. Infección de vías respiratorias altas / Control de crecimiento regular"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              {/* Controlled substance toggle & warning */}
              <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-800">Sustancias Controladas (Ley 50-88)</h4>
                    <p className="text-[8px] text-gray-400">Marque esta opción si prescribe psicotrópicos, analgésicos estupefacientes o derivados regulados.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isControlled}
                      onChange={(e) => setIsControlled(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                </div>

                {isControlled && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-[9px] font-bold flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      ATENCIÓN LEY 50-88: Al prescribir sustancias controladas, el médico asume responsabilidad penal directa. 
                      La receta digital impresa DEBERÁ ser firmada y sellada físicamente con sello de tinta húmeda por usted para ser válida en farmacias dominicanas.
                    </span>
                  </div>
                )}
              </div>

              {/* Items editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medicamentos Prescritos</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-[10px] bg-slate-900 text-white hover:bg-slate-950 font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir Fármaco
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-gray-150 p-4 rounded-2xl relative space-y-3">
                      
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="absolute right-3 top-3 p-1 hover:bg-rose-50 rounded-lg text-rose-500"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-450 uppercase tracking-widest block">Nombre Genérico (Sustancia Activa)</label>
                          <input
                            type="text"
                            placeholder="Ej. Paracetamol / Amoxicilina"
                            value={item.generic_name}
                            onChange={(e) => handleItemChange(idx, 'generic_name', e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-semibold focus:outline-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-455 uppercase tracking-widest block">Nombre Comercial (Sugerido)</label>
                          <input
                            type="text"
                            placeholder="Ej. Acetaminofén / Amoxil (Opcional)"
                            value={item.commercial_name}
                            onChange={(e) => handleItemChange(idx, 'commercial_name', e.target.value)}
                            className="w-full bg-white border border-gray-255 rounded-xl p-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="text-[8px] font-black text-gray-450 uppercase tracking-widest block">Concentración</label>
                          <input
                            type="text"
                            placeholder="Ej. 500 mg / 5 ml"
                            value={item.concentration}
                            onChange={(e) => handleItemChange(idx, 'concentration', e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-semibold text-slate-800"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-gray-450 uppercase tracking-widest block">Forma Farmac.</label>
                          <select
                            value={item.pharmaceutical_form}
                            onChange={(e) => handleItemChange(idx, 'pharmaceutical_form', e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="Tabletas">Tabletas</option>
                            <option value="Cápsulas">Cápsulas</option>
                            <option value="Jarabe">Jarabe</option>
                            <option value="Gotas">Gotas</option>
                            <option value="Inyectable">Inyectable</option>
                            <option value="Crema">Crema</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-gray-455 uppercase tracking-widest block">Dosis</label>
                          <input
                            type="text"
                            placeholder="Ej. 1 tableta / 5 ml"
                            value={item.dose}
                            onChange={(e) => handleItemChange(idx, 'dose', e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-semibold"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-gray-450 uppercase tracking-widest block">Frecuencia</label>
                          <input
                            type="text"
                            placeholder="Ej. Cada 8 horas"
                            value={item.frequency}
                            onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-semibold"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-gray-450 uppercase tracking-widest block">Duración</label>
                          <input
                            type="text"
                            placeholder="Ej. 7 días"
                            value={item.duration}
                            onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-semibold"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-1">
                          <label className="text-[8px] font-black text-gray-450 uppercase tracking-widest block">Cant. Entregar</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-semibold"
                            min={1}
                            required
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[8px] font-black text-gray-450 uppercase tracking-widest block">Instrucciones de Toma (Para el paciente)</label>
                          <input
                            type="text"
                            placeholder="Tomar después de las comidas. Diluir en agua."
                            value={item.instructions}
                            onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                            className="w-full bg-white border border-gray-250 rounded-xl p-2 text-xs font-semibold"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                >
                  Guardar y Emitir Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT DIALOGUE MODAL */}
      {showPrintModal && activePrescription && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-xl border border-gray-150 shadow-2xl relative space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150 print:p-0">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 print:hidden">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Printer className="h-4.5 w-4.5 text-pink-500" /> Vista Previa de Receta SNS
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={triggerPrint}
                  className="px-3.5 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir Receta
                </button>
                <button 
                  onClick={() => {
                    setShowPrintModal(false);
                    setActivePrescription(null);
                  }}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-slate-650 text-xs font-bold rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Printable Area - Standard Dominican Republic SNS format */}
            <div 
              id="print-prescription-area" 
              className="bg-white border border-gray-300 rounded-2xl p-6 font-sans text-slate-900 shadow-sm relative overflow-hidden select-text text-left max-w-lg mx-auto print:border-none"
            >
              {/* Doctor Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-sm font-black uppercase text-slate-900">{activePrescription.doctor_name}</h2>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{activePrescription.doctor_specialty}</p>
                
                <div className="flex flex-wrap justify-center gap-x-4 text-[8px] font-semibold text-gray-500 pt-1">
                  <span>EXEQUÁTUR N°: <strong className="text-slate-800">{activePrescription.doctor_exequatur}</strong></span>
                  <span>TEL: <strong className="text-slate-800">{activePrescription.doctor_phone}</strong></span>
                </div>
                <p className="text-[8px] text-gray-400 font-semibold">{activePrescription.doctor_address}</p>
              </div>

              {/* Patient and date grid */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 text-[10px] font-semibold">
                <div className="space-y-1">
                  <p><span className="text-gray-400">Paciente:</span> <strong className="text-slate-800">{activePrescription.patient_name}</strong></p>
                  <p><span className="text-gray-400">Alergias:</span> <span className="text-rose-600">{activePrescription.patient_allergies || 'Ninguna conocida'}</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="text-gray-400">Fecha Emisión:</span> <strong className="text-slate-800">{new Date(activePrescription.created_at).toLocaleDateString('es-ES')}</strong></p>
                  <p><span className="text-gray-400">Vence:</span> <strong className="text-slate-800">{new Date(activePrescription.expiry_date).toLocaleDateString('es-ES')}</strong></p>
                </div>
              </div>

              {/* Diagnosis CIE-10 */}
              <div className="py-2.5 text-[9px] border-b border-gray-150">
                <span className="text-gray-400 font-bold block mb-0.5">Diagnóstico / Indicación CIE-10:</span>
                <p className="font-semibold text-slate-700 italic">"{activePrescription.diagnosis || 'Control pre-natal regular'}"</p>
              </div>

              {/* Prescriptions medicines list */}
              <div className="py-4 space-y-4 min-h-[160px]">
                <span className="text-[12px] font-black text-slate-900 italic block font-serif tracking-widest border-b border-slate-900 pb-1">Rx</span>

                {activePrescription.items.map((item, index) => (
                  <div key={index} className="text-[10px] space-y-1">
                    <div className="flex justify-between items-start font-bold">
                      <span>
                        {index + 1}. {item.generic_name} 
                        {item.commercial_name && (
                          <span className="text-gray-500 font-medium text-[9px] ml-1">({item.commercial_name})</span>
                        )}
                        <span className="text-slate-500 text-[9px] font-medium ml-1.5">• {item.concentration} • {item.pharmaceutical_form}</span>
                      </span>
                      <span className="font-mono text-slate-700">Cant: #{item.quantity}</span>
                    </div>
                    <div className="pl-4 text-[9px] text-slate-650 font-semibold space-y-0.5 leading-relaxed">
                      <p>• Dosis: {item.dose} - {item.route} - {item.frequency} por {item.duration}</p>
                      {item.instructions && (
                        <p className="text-gray-450 italic">Indicación: {item.instructions}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Stamp & Signature section */}
              <div className="border-t border-gray-200 pt-6 mt-6 flex justify-between items-end">
                
                {/* Controlled warning and laws */}
                <div className="max-w-[240px] space-y-1">
                  {activePrescription.is_controlled && (
                    <span className="inline-block text-[7px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-sm">
                      ⚠️ CONTROLADO (LEY 50-88)
                    </span>
                  )}
                  <p className="text-[7px] text-gray-400 font-semibold leading-normal">
                    Firma digital autorizada por PharmaSync Mom & Baby SaaS. Válida por 30 días. 
                    El expendio de psicotrópicos requiere que la receta física impresa cuente con firma autógrafa y sello oficial húmedo del especialista.
                  </p>
                </div>

                {/* Signature graphic box */}
                <div className="text-center relative min-w-[150px]">
                  
                  {/* Digital Signature rendering */}
                  {db.doctors.find(d => d.id === activePrescription.doctor_id)?.signature_url ? (
                    <div className="absolute top-[-25px] left-1/2 transform -translate-x-1/2 h-10 w-24 bg-transparent pointer-events-none flex items-center justify-center opacity-80">
                      <div className="text-[10px] font-mono text-indigo-500 font-bold border border-dashed border-indigo-400/40 px-2 py-0.5 bg-white/90 rounded">
                        [Firma Digitalizada]
                      </div>
                    </div>
                  ) : null}

                  {/* Stamp rendering */}
                  {db.doctors.find(d => d.id === activePrescription.doctor_id)?.stamp_url ? (
                    <div className="absolute top-[-40px] left-4 h-12 w-12 bg-transparent pointer-events-none opacity-60 flex items-center justify-center">
                      <div className="h-10 w-10 border border-dashed border-rose-500/40 rounded-full flex items-center justify-center text-[7px] font-mono text-rose-500 uppercase font-black tracking-tighter leading-none">
                        Sello<br/>Médico
                      </div>
                    </div>
                  ) : null}

                  <div className="w-full border-t border-slate-900 pt-1 text-[8px] font-extrabold uppercase text-slate-800 tracking-wider">
                    Firma & Sello del Médico
                  </div>
                  <span className="text-[7px] text-gray-400 font-bold tracking-wider block mt-0.5">Exequátur N°: {activePrescription.doctor_exequatur}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
