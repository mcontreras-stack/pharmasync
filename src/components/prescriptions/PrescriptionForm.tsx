'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, PrescriptionItem, Prescription, Profile } from '@/lib/mockDb';
import { logDataChange } from '@/services/auditService';
import { Plus, Trash2, AlertTriangle, X } from 'lucide-react';

interface PrescriptionFormProps {
  user: Profile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PrescriptionForm({ user, onClose, onSuccess }: PrescriptionFormProps) {
  const [db, setDb] = useState(getMockDb());
  const [selectedMotherId, setSelectedMotherId] = useState('');
  const [selectedBabyId, setSelectedBabyId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [isControlled, setIsControlled] = useState(false);
  const [items, setItems] = useState<PrescriptionItem[]>([
    { generic_name: '', commercial_name: '', concentration: '', pharmaceutical_form: 'Tabletas', presentation: 'Caja', dose: '1 tableta', route: 'Vía oral', frequency: 'Cada 8 horas', duration: '7 días', quantity: 1, instructions: '' }
  ]);

  const mothers = db.profiles.filter(p => p.role === 'mother');
  const babies = db.babies.filter(b => b.mother_id === selectedMotherId);

  const handleAddItem = () => {
    setItems([...items, { generic_name: '', commercial_name: '', concentration: '', pharmaceutical_form: 'Tabletas', presentation: 'Caja', dose: '1 tableta', route: 'Vía oral', frequency: 'Cada 8 horas', duration: '7 días', quantity: 1, instructions: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMotherId || !diagnosis.trim() || items.some(i => !i.generic_name.trim())) return;

    const patientProfile = db.profiles.find(p => p.id === selectedMotherId);
    const doctorProfile = db.profiles.find(p => p.id === user.id);
    const doctorDetails = db.doctors.find(d => d.id === user.id);

    const validationCode = `VLD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPres: Prescription = {
      id: `pres-${Date.now()}`,
      doctor_id: user.id,
      mother_id: selectedMotherId,
      baby_id: selectedBabyId || undefined,
      diagnosis,
      is_controlled: isControlled,
      code: `REC-${Math.floor(1000000 + Math.random() * 9000000)}`,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      created_at: new Date().toISOString(),
      doctor_name: doctorProfile?.full_name || '',
      doctor_specialty: user.role === 'obstetrician' ? 'Obstetricia' : 'Pediatría',
      doctor_exequatur: doctorDetails?.exequatur || 'EQ-9921',
      doctor_address: doctorDetails?.clinic_address || 'Av. Metropolitana 23',
      doctor_phone: doctorDetails?.phone || '',
      patient_name: selectedBabyId ? babies.find(b => b.id === selectedBabyId)?.name || '' : patientProfile?.full_name || '',
      patient_age: selectedBabyId ? 1 : 28, // Sim. age
      patient_allergies: selectedBabyId ? undefined : db.mothers.find(m => m.id === selectedMotherId)?.allergies || 'Ninguna',
      items,
      uuid: crypto.randomUUID(),
      validation_code: validationCode,
      status: 'activa'
    };

    const updatedDb = { ...db, prescriptions: [newPres, ...db.prescriptions] };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    logDataChange({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'create_prescription',
      tableAffected: 'prescriptions',
      recordId: newPres.id,
      newValue: newPres
    });

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-gray-100 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 select-none">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">Emitir Receta Electrónica</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Paciente (Madre)</label>
              <select value={selectedMotherId} onChange={(e) => setSelectedMotherId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none" required>
                <option value="">Seleccione Paciente...</option>
                {mothers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            {selectedMotherId && babies.length > 0 && (
              <div>
                <label className="text-xs text-gray-400 block mb-1 font-semibold">Vincular a Hijo / Bebé (Opcional)</label>
                <select value={selectedBabyId} onChange={(e) => setSelectedBabyId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none">
                  <option value="">Ninguno (Receta para la madre)</option>
                  {babies.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Diagnóstico Clínico</label>
            <input type="text" placeholder="ej. Infección de vías urinarias leve, Control prenatal..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none" required />
          </div>

          <div className="space-y-3 border-t border-gray-50 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Medicamentos / Indicaciones</span>
              <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-[10px] text-pink-600 bg-pink-50 hover:bg-pink-100 border border-pink-100/50 px-2 py-1 rounded-lg font-bold">
                <Plus className="h-3.5 w-3.5" /> Agregar Medicamento
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50/50 border border-gray-150 p-4 rounded-2xl space-y-3 relative">
                <button type="button" onClick={() => handleRemoveItem(idx)} className="absolute right-3 top-3 p-1 hover:bg-gray-200 rounded-lg text-rose-500 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" placeholder="Nombre Genérico" value={item.generic_name} onChange={(e) => handleItemChange(idx, 'generic_name', e.target.value)} className="bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none" required />
                  <input type="text" placeholder="Nombre Comercial (Opcional)" value={item.commercial_name} onChange={(e) => handleItemChange(idx, 'commercial_name', e.target.value)} className="bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none" />
                  <input type="text" placeholder="Concentración (ej. 500mg)" value={item.concentration} onChange={(e) => handleItemChange(idx, 'concentration', e.target.value)} className="bg-white border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none" required />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input type="text" placeholder="Dosis (ej. 1 tableta)" value={item.dose} onChange={(e) => handleItemChange(idx, 'dose', e.target.value)} className="bg-white border border-gray-200 rounded-xl p-2 text-[10px] focus:outline-none" required />
                  <input type="text" placeholder="Frecuencia (ej. Cada 8 hrs)" value={item.frequency} onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)} className="bg-white border border-gray-200 rounded-xl p-2 text-[10px] focus:outline-none" required />
                  <input type="text" placeholder="Duración (ej. 7 días)" value={item.duration} onChange={(e) => handleItemChange(idx, 'duration', e.target.value)} className="bg-white border border-gray-200 rounded-xl p-2 text-[10px] focus:outline-none" required />
                  <input type="number" placeholder="Cant." value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)} className="bg-white border border-gray-200 rounded-xl p-2 text-[10px] focus:outline-none" required />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-gray-50 pt-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isControlled} onChange={(e) => setIsControlled(e.target.checked)} className="h-4.5 w-4.5 accent-pink-500 border border-gray-300 rounded-md cursor-pointer" />
              <span className="text-[10px] font-bold text-gray-600">¿Contiene Sustancia Controlada?</span>
            </label>
            {isControlled && (
              <div className="bg-amber-50 border border-amber-200/50 p-2.5 rounded-xl text-amber-700 text-[9px] leading-tight font-semibold max-w-sm flex items-start gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Advertencia: La prescripción de sustancias psicotrópicas o estupefacientes exige validez de exequátur aprobada y control estricto de recetas.</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button type="button" onClick={onClose} className="py-2.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold">Cancelar</button>
            <button type="submit" className="py-2.5 px-6 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs">Emitir Receta 📃</button>
          </div>
        </form>
      </div>
    </div>
  );
}
