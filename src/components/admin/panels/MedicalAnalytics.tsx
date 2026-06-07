'use client';

import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Baby,
  Syringe,
  Clipboard,
  ShieldCheck,
  Layers,
  Award,
  Construction
} from 'lucide-react';
import QualityDashboard from './QualityDashboard';

export default function MedicalAnalytics() {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'quality'>('analytics');

  return (
    <div className="space-y-6">
      {/* Selector subtabs */}
      <div className="flex border-b border-gray-100 gap-2 pb-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-slate-800 text-slate-800 bg-slate-50'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          Métricas Clínicas
        </button>
        <button
          onClick={() => setActiveSubTab('quality')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 rounded-t-xl shrink-0 cursor-pointer ${
            activeSubTab === 'quality'
              ? 'border-slate-800 text-slate-800 bg-slate-50'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="h-4 w-4" />
          Auditoría de Calidad & HIPAA
        </button>
      </div>

      {activeSubTab === 'quality' ? (
        <QualityDashboard />
      ) : (
        <>
          {/* HIPAA DISCLAIMER */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-gray-800 shadow-sm flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Panel de Inteligencia Médica</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                De acuerdo con las regulaciones HIPAA (Privacy Rule), todos los indicadores de este panel
                se calculan de manera agregada, anonimizada y no rastreable. Los datos clínicos
                se integrarán aquí a medida que los usuarios registren información en la plataforma.
              </p>
            </div>
          </div>

          {/* Coming Soon State */}
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xs text-center space-y-4">
            <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Construction className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-700">Métricas Clínicas en Construcción</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                Este panel mostrará estadísticas reales de embarazos, consultas, vacunas y bebés
                una vez que los usuarios comiencen a registrar información clínica en la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {[
                { icon: Heart,     label: 'Embarazos Activos',  note: 'Disponible con datos reales' },
                { icon: Baby,      label: 'Bebés Nacidos',       note: 'Disponible con datos reales' },
                { icon: Clipboard, label: 'Consultas Totales',   note: 'Disponible con datos reales' },
                { icon: Syringe,   label: 'Vacunas Aplicadas',   note: 'Disponible con datos reales' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-2xl p-4 text-center opacity-60">
                  <item.icon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-gray-500">{item.label}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
