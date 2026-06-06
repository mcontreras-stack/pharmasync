'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Doctor } from '@/lib/mockDb';
import { ShieldCheck, Signature, Award, GraduationCap, FileCheck, Trash2, Check } from 'lucide-react';
import { securityService } from '@/services/securityService';

export default function ProfessionalCredentialsForm() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Signature drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [fallbackInviteCode, setFallbackInviteCode] = useState('');

  useEffect(() => {
    if (user && !fallbackInviteCode) {
      const code = 'DR-' + user.full_name?.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 9000 + 1000);
      setTimeout(() => {
        setFallbackInviteCode(code);
      }, 0);
    }
  }, [user, fallbackInviteCode]);

  // Find doctor details
  const doctor = user ? (db.doctors.find(d => d.id === user.id) || {
    id: user.id, license_number: '', specialty: 'obstetrician' as const, phone: '', clinic_address: '', consultation_hours: '',
    verification_status: 'pending' as const, exequatur: '', cmd_number: '', university: '', graduation_year: undefined, subspecialty: '',
    invite_code: fallbackInviteCode
  }) : {
    id: '', license_number: '', specialty: 'obstetrician' as const, phone: '', clinic_address: '', consultation_hours: '',
    verification_status: 'pending' as const, exequatur: '', cmd_number: '', university: '', graduation_year: undefined, subspecialty: '',
    invite_code: ''
  };

  const [exequatur, setExequatur] = useState(doctor.exequatur || '');
  const [cmdNumber, setCmdNumber] = useState(doctor.cmd_number || '');
  const [university, setUniversity] = useState(doctor.university || '');
  const [gradYear, setGradYear] = useState(doctor.graduation_year ? String(doctor.graduation_year) : '');
  const [subspecialty, setSubspecialty] = useState(doctor.subspecialty || '');
  const [stampName, setStampName] = useState(doctor.stamp_url ? 'sello_digital.png' : '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    if (doctor.signature_url) {
      setTimeout(() => {
        setHasSignature(true);
      }, 0);
    }
  }, [doctor.signature_url]);

  if (!user) return null;

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = getCoords(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = getCoords(e, canvas);
    ctx.lineTo(x, y); ctx.stroke(); setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setStampName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(''); setErrorMsg('');
    if (!exequatur.trim()) {
      setErrorMsg('El número de Exequatur es obligatorio.');
      return;
    }
    let signatureUrl = doctor.signature_url;
    if (hasSignature && canvasRef.current) signatureUrl = canvasRef.current.toDataURL('image/png');

    const updatedDoctors = db.doctors.map(d => {
      if (d.id !== user.id) return d;
      return {
        ...d, exequatur, cmd_number: cmdNumber, university, subspecialty, signature_url: signatureUrl,
        graduation_year: gradYear ? parseInt(gradYear, 10) : undefined,
        stamp_url: stampName ? 'https://vitarahealth-demo.s3.amazonaws.com/stamps/doctor-stamp.png' : undefined,
        verification_status: d.verification_status === 'pending' || !d.verification_status ? 'under_review' as const : d.verification_status
      };
    });

    const updatedDb = { ...db, doctors: updatedDoctors };
    setDb(updatedDb); saveMockDb(updatedDb);
    securityService.logAccess(user.id, user.id, 'doctors', 'update_credentials');
    setSuccessMsg('Credenciales enviadas a revisión por el equipo médico administrador.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const statusBadge = () => {
    const status = doctor.verification_status || 'pending';
    const badges = {
      approved: ['bg-emerald-100 text-emerald-800', 'Aprobado / Activo'],
      under_review: ['bg-sky-100 text-sky-800', 'En Revisión'],
      rejected: ['bg-rose-100 text-rose-800', 'Rechazado']
    } as Record<string, string[]>;
    const [cls, txt] = badges[status] || ['bg-amber-100 text-amber-800', 'Pendiente de Envío'];
    return <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${cls}`}>{txt}</span>;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
        <div>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Credenciales Profesionales
          </h2>
          <p className="text-[10px] text-gray-400 mt-1">Valide su exequatur y registro del Colegio Médico Dominicano para emitir recetas oficiales.</p>
        </div>
        <div className="shrink-0">{statusBadge()}</div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold text-center">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Exequatur */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Número de Exequatur</label>
            <div className="relative">
              <Award className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                value={exequatur}
                onChange={(e) => setExequatur(e.target.value)}
                placeholder="Ej. EQ-12345"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
                required
              />
            </div>
          </div>

          {/* CMD Registration */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Registro CMD (Colegio Médico)</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                value={cmdNumber}
                onChange={(e) => setCmdNumber(e.target.value)}
                placeholder="Ej. CMD-9988"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* University */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Universidad de Graduación</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Ej. Universidad Autónoma de Santo Domingo (UASD)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* Graduation Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Año de Graduación</label>
            <input
              type="number"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              placeholder="Ej. 2012"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
            />
          </div>
        </div>

        {/* Subspecialties */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Subespecialidades / Enfoque Clínico</label>
          <input
            type="text"
            value={subspecialty}
            onChange={(e) => setSubspecialty(e.target.value)}
            placeholder="Ej. Endocrinología Reproductiva, Medicina Fetal, Neonatología Crítica"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 text-slate-800"
          />
        </div>

        {/* Signature drawing canvas & Stamp file upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Signature draw pad */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="flex items-center gap-1">
                <Signature className="h-4 w-4" /> Firma Electrónica Táctil
              </span>
              <button 
                type="button" 
                onClick={clearSignature}
                className="text-pink-500 hover:text-pink-600 transition-colors"
              >
                Limpiar
              </button>
            </div>

            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-2 h-[130px] flex items-center justify-center relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={360}
                height={110}
                className="w-full h-full bg-white rounded-xl cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <span className="absolute text-[9px] text-gray-400 font-bold pointer-events-none">Firme con el mouse o dedo en este recuadro</span>
              )}
            </div>
          </div>

          {/* Stamp PNG upload */}
          <div className="space-y-2 flex flex-col justify-between">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
              <FileCheck className="h-4 w-4" /> Sello Profesional Digitalizado
            </div>

            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-center items-center h-[130px] space-y-3">
              {stampName ? (
                <div className="w-full bg-white border border-gray-250 p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-bold truncate flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-emerald-500" /> {stampName}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setStampName('')}
                    className="p-1 hover:bg-slate-100 rounded-lg text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full cursor-pointer flex flex-col items-center justify-center border border-dashed border-gray-300 hover:border-gray-400 bg-white rounded-xl p-4 transition-all">
                  <FileCheck className="h-5 w-5 text-gray-400 mb-1" />
                  <span className="text-[9px] font-bold text-slate-650">Subir imagen de Sello (PNG)</span>
                  <input type="file" className="hidden" accept="image/png" onChange={handleStampUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Enviar Credenciales a Revisión
        </button>
      </form>
    </div>
  );
}
