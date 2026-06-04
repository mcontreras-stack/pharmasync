'use client';

import React from 'react';
import { getMockDb, NewbornRecord } from '@/lib/mockDb';
import { Scale, Activity, HeartPulse, ShieldCheck, Award } from 'lucide-react';

interface NewbornRecordViewerProps {
  babyId: string;
}

export default function NewbornRecordViewer({ babyId }: NewbornRecordViewerProps) {
  const db = getMockDb();

  const record = db.newborn_records?.find(r => r.baby_id === babyId) || {
    id: `newborn-${Date.now()}`,
    baby_id: babyId,
    pregnancy_id: '',
    apgar_1min: 9,
    apgar_5min: 10,
    birth_weight_grams: 3200,
    birth_height_cm: 50,
    head_circumference_cm: 34.5,
    complications: 'Ninguna reportada',
    screenings: [
      { test_name: 'Metabólico', result: 'normal', date: new Date().toISOString().split('T')[0] },
      { test_name: 'Auditivo', result: 'normal', date: new Date().toISOString().split('T')[0] }
    ],
    vaccines: [
      { name: 'BCG (Tuberculosis)', applied: true, date: new Date().toISOString().split('T')[0], lot: 'BCG-99A' },
      { name: 'Hepatitis B (Dosis Recién Nacido)', applied: true, date: new Date().toISOString().split('T')[0], lot: 'HB-881' }
    ]
  } as NewbornRecord;

  return (
    <div className="space-y-6 select-none text-left">
      {/* Sommometry metrics */}
      <div className="bg-slate-50 border border-gray-150 rounded-2xl p-4 flex justify-between items-center text-center">
        <div className="flex-1 border-r border-gray-200">
          <span className="text-[17px] font-black text-slate-800 block leading-none">{record.birth_weight_grams} g</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Peso al Nacer</span>
        </div>
        <div className="flex-1 border-r border-gray-200">
          <span className="text-[17px] font-black text-slate-800 block leading-none">{record.birth_height_cm} cm</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Talla al Nacer</span>
        </div>
        <div className="flex-1">
          <span className="text-[17px] font-black text-slate-800 block leading-none">{record.head_circumference_cm} cm</span>
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-1">C. Cefálica</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* APGAR & Complications */}
        <div className="border border-gray-100 rounded-2xl p-4 space-y-4">
          <div>
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <Activity className="h-4 w-4 text-pink-500" />
              Puntuación APGAR
            </h4>
            <div className="flex gap-4 pt-3">
              <div className="bg-pink-50 border border-pink-100 rounded-xl p-2 px-4 text-center">
                <span className="text-xs text-pink-800 font-black block">1er Min</span>
                <span className="text-lg font-black text-pink-900">{record.apgar_1min} / 10</span>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-2 px-4 text-center">
                <span className="text-xs text-purple-800 font-black block">5 Min</span>
                <span className="text-lg font-black text-purple-900">{record.apgar_5min} / 10</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-gray-400 font-bold block text-[9px] uppercase">Complicaciones de Parto:</span>
            <p className="text-xs font-semibold text-slate-700">{record.complications || 'Ninguna reportada.'}</p>
          </div>
        </div>

        {/* Screenings and Vaccines */}
        <div className="border border-gray-100 rounded-2xl p-4 space-y-4">
          {/* Screenings */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <HeartPulse className="h-4 w-4 text-indigo-500" />
              Tamizajes Clínicos
            </h4>
            <div className="space-y-1.5 pt-1">
              {record.screenings?.map((scr, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">{scr.test_name}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    scr.result === 'normal' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : scr.result === 'anormal' 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {scr.result}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vaccines */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              Vacunas Inmediatas
            </h4>
            <div className="space-y-1.5 pt-1">
              {record.vaccines?.map((vac, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 truncate max-w-[170px]">{vac.name}</span>
                  {vac.applied ? (
                    <span className="text-[8px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-black uppercase">
                      Lote: {vac.lot || 'N/D'}
                    </span>
                  ) : (
                    <span className="text-[8px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-black uppercase">
                      Pendiente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
