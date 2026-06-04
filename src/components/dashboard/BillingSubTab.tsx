'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Doctor } from '@/lib/mockDb';
import { CreditCard, Check, ShieldCheck, Zap } from 'lucide-react';

export default function BillingSubTab() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [successMsg, setSuccessMsg] = useState('');

  if (!user) return null;

  const isDoctor = user.role === 'obstetrician' || user.role === 'pediatrician';
  
  // Find doctor or patient details
  const doctor = isDoctor ? db.doctors.find(d => d.id === user.id) : null;
  const currentPlanId = isDoctor ? (doctor?.plan_type || 'free') : 'free';

  // Subscriptions pricing tiers for Doctors
  const doctorPlans = [
    {
      id: 'free',
      name: 'Free Profesional',
      price: 'RD$ 0',
      period: 'por siempre',
      desc: 'Adecuado para prácticas médicas iniciales y pruebas.',
      features: [
        'Hasta 10 expedientes de pacientes',
        'Agenda de citas básica',
        'Recetas electrónicas sin firma gráfica',
        'Acceso a chat limitado'
      ],
      limits: { patients: 10, ai: 20, storage: 10 }
    },
    {
      id: 'professional',
      name: 'Profesional Médico',
      price: 'RD$ 1,999',
      period: 'al mes',
      desc: 'Para especialistas independientes que requieren recetas impresas ilimitadas.',
      features: [
        'Pacientes y expedientes ilimitados',
        'Recetas con firma y sello digitalizados',
        'Impresión en formato oficial SNS',
        'Chat y alertas ilimitadas',
        'Soporte técnico prioritario'
      ],
      limits: { patients: 9999, ai: 9999, storage: 5000 }
    },
    {
      id: 'clinic',
      name: 'Red de Clínicas',
      price: 'RD$ 6,999',
      period: 'al mes',
      desc: 'Para redes de consultorios y clínicas con múltiples médicos.',
      features: [
        'Todo lo de Profesional',
        'Múltiples sucursales y consultorios',
        'Perfiles para secretarias / asistentes',
        'Reportes de facturación consolidados',
        'API de integración de farmacias'
      ],
      limits: { patients: 9999, ai: 9999, storage: 20000 }
    }
  ];

  // Subscriptions pricing tiers for Mothers
  const motherPlans = [
    {
      id: 'free',
      name: 'Plan Mom Básico',
      price: 'RD$ 0',
      period: 'por siempre',
      desc: 'Acceso a expediente básico, control prenatal y recetas digitales.',
      features: [
        'Perfil de embarazo o familiar básico',
        'Historial de recetas electrónicas',
        'Agenda de citas con su médico principal',
        'Límite de 5 consultas AI al mes'
      ],
      limits: { patients: 1, ai: 5, storage: 5 }
    },
    {
      id: 'premium',
      name: 'Mom Premium',
      price: 'RD$ 499',
      period: 'al mes',
      desc: 'Acceso completo e ilimitado para el control de la salud maternal y neonatal.',
      features: [
        'Modo Embarazo & Modo Familia multi-bebé',
        'Consultas de Asistente AI ilimitadas',
        'Historial clínico exportable PDF/JSON',
        'Recordatorios SMS y WhatsApp para vacunas',
        'Alertas de riesgo automatizadas'
      ],
      limits: { patients: 5, ai: 9999, storage: 1000 }
    }
  ];

  const plans = isDoctor ? doctorPlans : motherPlans;
  const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];

  // Simulated metrics
  const activePatientsCount = isDoctor ? db.mothers?.length || 6 : 1;
  const aiConsultationsCount = 8;
  const storageUsageMb = 4.2;

  const handleUpgrade = (planId: string) => {
    if (isDoctor && doctor) {
      const updatedDoctors = db.doctors.map(d => {
        if (d.id === user.id) {
          return { ...d, plan_type: planId };
        }
        return d;
      });
      const updatedDb = { ...db, doctors: updatedDoctors };
      setDb(updatedDb);
      saveMockDb(updatedDb);
      setSuccessMsg(`¡Te has suscrito exitosamente al plan ${plans.find(p => p.id === planId)?.name}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      // Simulate patient upgrade
      setSuccessMsg(`Simulación: Petición de actualización a ${plans.find(p => p.id === planId)?.name} enviada.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Current Plan Summary Card */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-purple-500/20 rounded-full blur-xl -ml-5 pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-pink-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-200">Suscripción Activa</span>
          </div>
          <h2 className="text-xl font-black">{currentPlan.name}</h2>
          <p className="text-xs text-white/80 max-w-md">{currentPlan.desc}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[160px] relative z-10 shrink-0">
          <span className="text-[9px] font-black uppercase text-pink-200 block mb-1">Costo de Licencia</span>
          <span className="text-xl font-black block">{currentPlan.price}</span>
          <span className="text-[9px] text-white/70 block mt-0.5">{currentPlan.period}</span>
        </div>
      </div>

      {/* Usage limits meters */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Límites y Consumo de Recursos</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Patients limit */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-400 uppercase tracking-wider">{isDoctor ? 'Expedientes Pacientes' : 'Perfiles de Bebés'}</span>
              <span className="text-slate-700">{activePatientsCount} / {currentPlan.limits.patients === 9999 ? '∞' : currentPlan.limits.patients}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-pink-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (activePatientsCount / currentPlan.limits.patients) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* AI Questions */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-400 uppercase tracking-wider">Consultas Asistente AI</span>
              <span className="text-slate-700">{aiConsultationsCount} / {currentPlan.limits.ai === 9999 ? '∞' : currentPlan.limits.ai}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (aiConsultationsCount / currentPlan.limits.ai) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Cloud Storage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-gray-400 uppercase tracking-wider">Almacenamiento en Nube</span>
              <span className="text-slate-700">{storageUsageMb} MB / {currentPlan.limits.storage >= 1000 ? `${(currentPlan.limits.storage/1000).toFixed(0)} GB` : `${currentPlan.limits.storage} MB`}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (storageUsageMb / currentPlan.limits.storage) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-center text-xs font-bold">
          {successMsg}
        </div>
      )}

      {/* Plan comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          return (
            <div 
              key={plan.id}
              className={`bg-white rounded-3xl p-5 border flex flex-col justify-between space-y-5 transition-all relative ${
                isCurrent 
                  ? 'border-purple-500 shadow-md ring-1 ring-purple-500/20' 
                  : 'border-gray-150 hover:border-gray-300'
              }`}
            >
              {isCurrent && (
                <span className="absolute top-3 right-3 bg-purple-600 text-white font-black text-[7px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Plan Activo
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{plan.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-800">{plan.price}</span>
                  <span className="text-[10px] text-gray-400 font-semibold">{plan.period}</span>
                </div>

                <ul className="space-y-2 border-t border-gray-100 pt-4 text-[10px] font-semibold text-slate-650">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-snug">
                      <Check className="h-3.5 w-3.5 text-pink-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isCurrent 
                    ? 'bg-purple-50 text-purple-700 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-slate-950 text-white shadow-xs'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                {isCurrent ? 'Tu Plan Actual' : 'Suscribirse al Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
