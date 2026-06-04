'use client';

import React, { useState } from 'react';
import { verifyPrescription, addAuditLog, Prescription } from '@/lib/mockDb';
import { ShieldCheck, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';

export default function PrescriptionVerify() {
  const [searchCode, setSearchCode] = useState('');
  const [result, setResult] = useState<Prescription | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setErrorMsg('');
    setHasSearched(true);
    const pres = verifyPrescription(searchCode.trim());

    if (pres) {
      setResult(pres);
      addAuditLog({
        user_email: 'anonymous_pharmacy@vitarahealth.com',
        user_role: 'pharmacist',
        action: 'verify_prescription',
        table_affected: 'prescriptions',
        record_id: pres.id,
        new_value: { code_used: searchCode },
        ip_address: '127.0.0.1'
      });
    } else {
      setResult(null);
      setErrorMsg('No se encontró ninguna receta con el código o UUID provisto. Verifique los caracteres e intente nuevamente.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 max-w-xl mx-auto space-y-6 shadow-xl select-none">
      <div className="space-y-2 text-center">
        <div className="h-12 w-12 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black">Validador Público de Recetas Digitales</h3>
        <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
          Ingrese el código de validación, el código oficial de la receta o el UUID para auditar su vigencia de dispensación.
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex gap-2">
        <input
          type="text"
          placeholder="ej. VLD-2849, REC-2849201 o UUID..."
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-slate-700"
          required
        />
        <button
          type="submit"
          className="px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Validar
        </button>
      </form>

      {hasSearched && result && (
        <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
            <div>
              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block">Código Oficial</span>
              <span className="text-sm font-mono font-black text-slate-100">{result.code}</span>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block">Vigencia</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-wider">
                {result.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[10px]">
            <div>
              <span className="text-slate-500 block font-bold text-[9px] uppercase tracking-wider">Médico Emisor</span>
              <span className="font-extrabold text-slate-350">{result.doctor_name}</span>
              <span className="block text-purple-400 font-semibold">{result.doctor_specialty}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block font-bold text-[9px] uppercase tracking-wider">Exequátur</span>
              <span className="font-extrabold text-slate-350">{result.doctor_exequatur}</span>
            </div>
          </div>

          <div className="border-t border-slate-850 pt-3">
            <span className="text-slate-500 block font-bold text-[9px] uppercase tracking-wider mb-2">Tratamiento Aprobado</span>
            <div className="space-y-2">
              {result.items.map((item, idx) => (
                <div key={idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50 flex justify-between items-center text-[10px]">
                  <div>
                    <span className="font-black text-slate-200">{item.generic_name} {item.concentration}</span>
                    <span className="block text-[8.5px] text-slate-500 font-semibold">{item.dose} • {item.frequency} • {item.duration}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-bold">Cant: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl text-center text-emerald-400 text-[9px] leading-tight font-semibold flex items-center justify-center gap-1.5 select-none">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Receta médica digital auténtica. Cumple con la Ley 87-01 y regulaciones de auditoría HIPAA.</span>
          </div>
        </div>
      )}

      {hasSearched && errorMsg && (
        <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl flex items-start gap-2.5 text-rose-400 text-[10.5px] leading-relaxed select-none">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
