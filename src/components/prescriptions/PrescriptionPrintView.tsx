'use client';

import React, { useRef } from 'react';
import { Prescription, Profile } from '@/types/database';
import { X, Printer, ShieldCheck } from 'lucide-react';

interface PrescriptionPrintViewProps {
  prescription: Prescription;
  onClose: () => void;
}

export default function PrescriptionPrintView({ prescription, onClose }: PrescriptionPrintViewProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const validationUrl = `https://vitarahealth.com/verify/prescription/${prescription.uuid}`;
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=120x120&chl=${encodeURIComponent(validationUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-gray-100 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
        
        {/* Modal Controls */}
        <div className="flex justify-between items-center shrink-0 border-b border-gray-50 pb-2 print:hidden">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 text-sm">Vista Previa de Receta</h3>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-0.5">
              <ShieldCheck className="h-3 w-3" /> Firmada Digitalmente
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir Receta
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printAreaRef} className="flex-1 overflow-y-auto p-8 border border-gray-250 bg-white rounded-2xl print:border-0 print:p-0 print:overflow-visible">
          <div className="space-y-6 max-w-xl mx-auto text-slate-900 relative">
            
            {/* Header / Brand Logo */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 font-black text-xl tracking-tight text-slate-800">
                  <span className="text-pink-500">Pharma</span>
                  <span className="text-emerald-500">Sync</span>
                </div>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Plataforma Digital de Salud Pre-Natal & Pediátrica</p>
                <p className="text-[10px] font-bold text-gray-700">{prescription.doctor_address}</p>
                <p className="text-[9px] text-gray-500 font-medium">Tel: {prescription.doctor_phone}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">Receta Médica Oficial</h2>
                <p className="text-[11px] font-mono font-black text-slate-700 mt-1">{prescription.code}</p>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Vence: {prescription.expiry_date.split('T')[0]}</p>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[10px]">
              <div>
                <span className="text-gray-450 block font-bold text-[9px] uppercase tracking-wider">Médico Prescriptor</span>
                <span className="font-black text-slate-800 text-xs">{prescription.doctor_name}</span>
                <span className="block text-[9px] text-purple-600 font-bold">{prescription.doctor_specialty}</span>
              </div>
              <div className="text-right space-y-0.5">
                <p className="font-bold text-slate-700">Exequátur N°: {prescription.doctor_exequatur}</p>
                <p className="text-gray-500">CMD Colegiatura N°: CMD-9482</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-4 text-[10px]">
              <div>
                <span className="text-gray-400 block font-semibold text-[9px]">Paciente</span>
                <span className="font-bold text-slate-800">{prescription.patient_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold text-[9px]">Alergias</span>
                <span className="font-bold text-rose-600">{prescription.patient_allergies || 'Ninguna'}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block font-semibold text-[9px]">Fecha de Emisión</span>
                <span className="font-bold text-slate-700">{prescription.created_at.split('T')[0]}</span>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="text-[10px] space-y-1">
              <span className="text-gray-450 font-black uppercase text-[8px] tracking-wider block">Diagnóstico</span>
              <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 leading-relaxed">
                {prescription.diagnosis}
              </p>
            </div>

            {/* Prescribed Items */}
            <div className="space-y-4">
              <span className="text-gray-450 font-black uppercase text-[8px] tracking-wider block">Tratamiento e Indicaciones</span>
              
              <div className="space-y-3">
                {prescription.items.map((item, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 space-y-1">
                    <div className="flex justify-between items-baseline text-[11px]">
                      <span className="font-black text-slate-800">
                        {item.generic_name} {item.concentration} ({item.pharmaceutical_form})
                        {item.commercial_name && <span className="text-[9px] text-gray-500 font-bold ml-1.5">[{item.commercial_name}]</span>}
                      </span>
                      <span className="text-xs font-bold text-slate-700 font-mono">Cant: {item.quantity}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                      Dosificación: <span className="font-bold">{item.dose}</span> por vía <span className="font-semibold">{item.route}</span>, <span className="font-semibold">{item.frequency}</span> durante <span className="font-semibold">{item.duration}</span>.
                    </p>
                    {item.instructions && (
                      <p className="text-[9.5px] text-slate-450 italic leading-tight">
                        Nota: &quot;{item.instructions}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Signature & Verification Stamp Area */}
            <div className="grid grid-cols-3 gap-6 pt-12 border-t-2 border-slate-900 items-end">
              
              {/* QR verification details */}
              <div className="col-span-2 flex items-center gap-3">
                <img
                  src={qrUrl}
                  alt="Código QR de Verificación"
                  className="h-16 w-16 bg-white border border-gray-250 p-1.5 rounded-lg shadow-2xs shrink-0 select-none"
                />
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Validación Oficial</span>
                  <p className="text-[8.5px] text-slate-600 font-bold leading-tight">Escanea el código QR para validar la vigencia de esta receta digital en el portal oficial.</p>
                  <p className="text-[9px] font-mono font-bold text-slate-450 mt-1">Cód. Validac: <span className="text-slate-800 font-black">{prescription.validation_code}</span></p>
                </div>
              </div>

              {/* Physician stamp & signature */}
              <div className="flex flex-col items-center justify-end relative text-center min-h-[90px]">
                {/* Simulated Signature */}
                <div className="absolute top-[-30px] h-10 w-24 bg-transparent pointer-events-none flex items-center justify-center opacity-85 select-none print:opacity-100">
                  <div className="text-[9px] font-mono text-indigo-500 font-black border border-dashed border-indigo-400 bg-white/95 px-2 py-0.5 rounded shadow-2xs">
                    [Firma Digitalizada]
                  </div>
                </div>

                {/* Simulated Stamp */}
                <div className="absolute top-[-45px] left-[-20px] h-12 w-12 bg-transparent pointer-events-none opacity-60 flex items-center justify-center select-none print:opacity-90">
                  <div className="h-10 w-10 border border-dashed border-rose-500 rounded-full flex items-center justify-center text-[7px] font-mono text-rose-500 uppercase font-black tracking-tighter leading-none">
                    Sello<br/>Médico
                  </div>
                </div>

                <div className="w-full border-t border-slate-900 pt-1 text-[8.5px] font-black uppercase text-slate-800 tracking-wider">
                  Firma & Sello del Médico
                </div>
                <span className="text-[7.5px] text-gray-400 font-bold mt-0.5">Exequátur N°: {prescription.doctor_exequatur}</span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
