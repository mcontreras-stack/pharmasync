'use client';

import React, { useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { getMockDb, saveMockDb, MotherDoc, ProfessionalDoc } from '@/lib/mockDb';

interface OnboardingWizardProps {
  user: any;
  onSignOut: () => void;
  onSubmitted: () => void;
}

export default function OnboardingWizard({ user, onSignOut, onSubmitted }: OnboardingWizardProps) {
  const isMother = user.role === 'mother';

  // Input states
  const [nationalId, setNationalId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [exequaturNum, setExequaturNum] = useState('');
  const [colegiaturaNum, setColegiaturaNum] = useState('');
  const [experienceYears, setExperienceYears] = useState('2');
  const [clinicAddress, setClinicAddress] = useState('');
  
  // File Upload states (simulated)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: { name: string; size: string } }>({});
  const [errorMsg, setErrorMsg] = useState('');

  const simulateFileUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: { name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` }
      }));
    }
  };

  const handleRemoveFile = (fieldName: string) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nationalId) {
      setErrorMsg('La cédula de identidad es requerida.');
      return;
    }

    const requiredFiles = isMother ? ['idFront', 'idBack'] : ['idFront', 'idBack', 'degree', 'exequaturDoc'];

    for (const key of requiredFiles) {
      if (!uploadedFiles[key]) {
        setErrorMsg('Por favor sube todos los documentos obligatorios requeridos.');
        return;
      }
    }

    const db = getMockDb();

    // Update user profile fields in db
    db.profiles = db.profiles.map(p => {
      if (p.id === user.id) {
        return { ...p, national_id: nationalId, birth_date: birthDate || p.birth_date };
      }
      return p;
    });
    if (isMother) {
      db.mothers = db.mothers.map(m => m.id === user.id ? { ...m, phone: user.phone || '', birth_date: birthDate, blood_type: bloodType } : m);
      const motherDocs: MotherDoc[] = ['id_front', 'id_back', ...(uploadedFiles['pregnancyCert'] ? ['pregnancy_cert'] : [])].map((type, i) => ({
        id: `mdoc-${Date.now()}-${i}`, mother_id: user.id, type,
        file_url: `https://vitarahealth-demo.s3.amazonaws.com/docs/${type === 'pregnancy_cert' ? 'pregnancy-cert.pdf' : `${type.replace('_', '-')}.jpg`}`,
        status: 'pending', created_at: new Date().toISOString()
      }));
      db.mother_documents = [...(db.mother_documents || []), ...motherDocs];
    } else {
      db.doctors = db.doctors.map(d => d.id === user.id ? {
        ...d, exequatur: exequaturNum, colegiatura: colegiaturaNum, experience_years: parseInt(experienceYears) || 2,
        clinic_address: clinicAddress, national_id: nationalId, phone: user.phone || ''
      } : d);
      const profDocs: ProfessionalDoc[] = ['id_front', 'id_back', 'degree', 'exequatur'].map((type, i) => ({
        id: `pdoc-${Date.now()}-${i}`, doctor_id: user.id, type,
        file_url: `https://vitarahealth-demo.s3.amazonaws.com/docs/${type === 'degree' || type === 'exequatur' ? `${type.replace('exequatur', 'exequatur-cert')}.pdf` : `${type.replace('_', '-')}.jpg`}`,
        status: 'pending', created_at: new Date().toISOString()
      }));
      db.professional_documents = [...(db.professional_documents || []), ...profDocs];
    }

    saveMockDb(db);
    onSubmitted();
  };

  const handleAutocomplete = () => {
    setNationalId('001-1938201-9'); setBirthDate('1992-06-15');
    if (!isMother) {
      setExequaturNum('EQ-9481'); setColegiaturaNum('CMD-8291');
      setClinicAddress('Av. Independencia 505, Santo Domingo');
      setUploadedFiles({
        idFront: { name: 'cedula_front.png', size: '1.2 MB' }, idBack: { name: 'cedula_back.png', size: '1.1 MB' },
        degree: { name: 'titulo_medico.pdf', size: '3.4 MB' }, exequaturDoc: { name: 'decreto_exequatur.pdf', size: '0.8 MB' }
      });
    } else {
      setUploadedFiles({ idFront: { name: 'cedula_front.png', size: '1.2 MB' }, idBack: { name: 'cedula_back.png', size: '1.1 MB' } });
    }
    setErrorMsg('');
  };

  return (
    <main className="min-h-screen bg-slate-955 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-850 rounded-[32px] p-8 shadow-2xl space-y-6 text-left select-none">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">Validación de Credenciales</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Por ley, requerimos validar su identidad nacional y credenciales profesionales oficiales para autorizar su firma digital.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Cédula de Identidad</label>
              <input
                type="text"
                placeholder="001-0000000-0"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-455 uppercase tracking-widest">Fecha de Nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {isMother ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Grupo Sanguíneo</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-200 focus:outline-none"
                >
                  <option value="O+">O Positivo (O+)</option>
                  <option value="O-">O Negativo (O-)</option>
                  <option value="A+">A Positivo (A+)</option>
                  <option value="A-">A Negativo (A-)</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Número de Exequátur</label>
                  <input
                    type="text"
                    placeholder="EQ-12345"
                    value={exequaturNum}
                    onChange={(e) => setExequaturNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Colegiatura CMD</label>
                  <input
                    type="text"
                    placeholder="CMD-5544"
                    value={colegiaturaNum}
                    onChange={(e) => setColegiaturaNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Años Experiencia</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Dirección Consultorio</label>
                  <input
                    type="text"
                    placeholder="Ej. Clínica Unión Médica, Santiago"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-3 pt-2">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block">Documentos Requeridos (Carga Simulada)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'idFront', label: 'Cédula (Frente)', sub: 'Frente de la identificación nacional' },
                { key: 'idBack', label: 'Cédula (Reverso)', sub: 'Reverso de la identificación nacional' },
                ...(!isMother ? [
                  { key: 'degree', label: 'Título Médico', sub: 'Título universitario oficial' },
                  { key: 'exequaturDoc', label: 'Cert. Exequátur', sub: 'Decreto del Poder Ejecutivo' }
                ] : [])
              ].map(f => (
                <div key={f.key} className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[110px]">
                  <div>
                    <h4 className="text-[11px] font-bold text-white">{f.label}</h4>
                    <p className="text-[8px] text-slate-500 mt-0.5">{f.sub}</p>
                  </div>
                  {uploadedFiles[f.key] ? (
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl text-[9px] mt-2">
                      <span className="font-bold text-slate-350 truncate max-w-[130px]">{uploadedFiles[f.key].name}</span>
                      <button type="button" onClick={() => handleRemoveFile(f.key)} className="p-1 text-rose-500 hover:bg-slate-850 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-dashed border-slate-800 rounded-xl text-[9px] font-bold text-slate-300 transition-all hover:bg-slate-850">
                      <UploadCloud className="h-4 w-4" /> Seleccionar
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => simulateFileUpload(f.key, e)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-450 font-bold bg-rose-950/20 border border-rose-500/10 p-2.5 rounded-xl text-center">{errorMsg}</p>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onSignOut}
              className="flex-1 py-3 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Enviar a Revisión
            </button>
          </div>
          
          <button
            type="button"
            onClick={handleAutocomplete}
            className="w-full text-center py-2 text-[9px] font-black text-slate-500 hover:text-slate-400 tracking-wider uppercase bg-slate-950 rounded-xl cursor-pointer"
          >
            Autocompletar Formulario & Documentos Demo
          </button>
        </form>
      </div>
    </main>
  );
}
