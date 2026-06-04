'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  FlaskConical,
  ShoppingBag,
  Video,
  Shield,
  Briefcase,
  Store,
  ArrowRight,
  Database,
  Link,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function FutureRoadmap() {
  const [activeRoadmapModule, setActiveRoadmapModule] = useState<'labs' | 'pharmacies' | 'telemedicine' | 'insurance' | 'corporate' | 'marketplace'>('labs');

  const roadmapModules = [
    {
      id: 'labs' as const,
      label: 'Laboratorios Clínicos',
      icon: FlaskConical,
      tagline: 'Integración de resultados de análisis y ecografías morfológicas mediante Webhooks',
      dbTables: ['lab_requisitions', 'lab_partners', 'hl7_payload_logs'],
      endpoints: ['POST /api/v1/labs/results-push', 'GET /api/v1/labs/requisitions'],
      architectureDesc: 'El módulo habilitará a laboratorios externos certificados a empujar de forma asíncrona resultados en formato estándar HL7 o PDF encriptado. Utilizará firmas criptográficas HMAC para garantizar el origen legítimo del laboratorio y asociará el resultado al expediente prenatal o pediátrico correspondiente usando la clave foránea universal del paciente.',
      colorClass: 'text-purple-600 bg-purple-50 hover:bg-purple-100/50'
    },
    {
      id: 'pharmacies' as const,
      label: 'Farmacias y Recetas',
      icon: ShoppingBag,
      tagline: 'Despacho de recetas electrónicas de obstetras y pediatras con firma digital',
      dbTables: ['electronic_prescriptions', 'prescription_items', 'pharmacy_dispenses'],
      endpoints: ['POST /api/v1/prescriptions/sign', 'GET /api/v1/pharmacies/verify-code'],
      architectureDesc: 'Permitirá la firma digital de recetas médicas utilizando tokens y llaves públicas de los médicos registrados. Las farmacias integradas podrán validar el código hash QR único de la receta para marcar el medicamento como despachado, previniendo duplicidades y manteniendo la trazabilidad del consumo del paciente.',
      colorClass: 'text-pink-600 bg-pink-50 hover:bg-pink-100/50'
    },
    {
      id: 'telemedicine' as const,
      label: 'Telemedicina Integrada',
      icon: Video,
      tagline: 'Salas de consulta virtual en tiempo real (WebRTC/Twilio Rooms)',
      dbTables: ['telemed_sessions', 'session_tokens', 'consultation_notes'],
      endpoints: ['POST /api/v1/telemed/create-room', 'GET /api/v1/telemed/session-status'],
      architectureDesc: 'Habilitará videollamadas HIPAA-compliant directamente en el portal web de PharmaSync. Integrará servidores WebRTC para conexiones punto a punto cifradas de extremo a extremo, facilitando controles prenatales remotos y consultas de urgencias pediátricas leves.',
      colorClass: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100/50'
    },
    {
      id: 'insurance' as const,
      label: 'Seguros Médicos',
      icon: Shield,
      tagline: 'Validación de cobertura médica de prepagas en tiempo real',
      dbTables: ['insurance_plans', 'claims_reimbursements', 'eligibility_checks'],
      endpoints: ['POST /api/v1/insurance/verify-eligibility', 'POST /api/v1/insurance/submit-claim'],
      architectureDesc: 'El sistema conectará mediante APIs externas con los servidores de las principales empresas de medicina prepaga y obras sociales para validar la elegibilidad de reintegros y copagos en cada consulta agendada, facilitando los cobros de los médicos independientes.',
      colorClass: 'text-sky-600 bg-sky-50 hover:bg-sky-100/50'
    },
    {
      id: 'corporate' as const,
      label: 'Salud Ocupacional',
      icon: Briefcase,
      tagline: 'Planes corporativos para el acompañamiento de maternidad en empleadas',
      dbTables: ['corporate_accounts', 'employee_registries', 'corporate_benefits'],
      endpoints: ['GET /api/v1/corporate/analytics', 'POST /api/v1/corporate/invite-employee'],
      architectureDesc: 'Proveerá un panel corporativo para empresas que contraten PharmaSync como beneficio de bienestar para sus empleadas embarazadas, promoviendo el acompañamiento clínico, la reducción del ausentismo laboral y la reincorporación segura tras la licencia por maternidad.',
      colorClass: 'text-slate-700 bg-slate-100 hover:bg-slate-200/50'
    },
    {
      id: 'marketplace' as const,
      label: 'Marketplace Pediátrico',
      icon: Store,
      tagline: 'E-commerce integrado de dispositivos de salud, lactancia y pañales',
      dbTables: ['marketplace_products', 'cart_items', 'orders_payments'],
      endpoints: ['GET /api/v1/marketplace/products', 'POST /api/v1/marketplace/checkout'],
      architectureDesc: 'Integrará un marketplace curado con recomendaciones directas de pediatras (por ejemplo, extractores de leche materna, termómetros inteligentes, monitores de respiración para cunas), permitiendo compras seguras desde la app con envíos a domicilio.',
      colorClass: 'text-amber-600 bg-amber-50 hover:bg-amber-100/50'
    }
  ];

  const currentModule = roadmapModules.find(m => m.id === activeRoadmapModule)!;
  const ActiveIcon = currentModule.icon;

  return (
    <div className="space-y-6 select-none">
      {/* 1. VISION AND SAAS PLATFORM STATEMENT */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-slate-850 shrink-0" />
          Mapa de Ruta y Extensibilidad del Ecosistema SaaS
        </h2>
        <p className="text-[10px] text-gray-400 leading-relaxed max-w-4xl">
          Nuestra arquitectura Core Postgres se diseñó bajo una filosofía limpia e independiente del dominio para permitir adiciones modulares de negocio en el futuro. Los nuevos dominios (farmacias, laboratorios, prepagas) se conectan mediante claves foráneas a los perfiles base de usuario, garantizando un crecimiento escalable sin alterar la integridad estructural actual de PharmaSync.
        </p>
      </div>

      {/* 2. ROADMAP MODULES TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left selector sidebar */}
        <div className="space-y-2 lg:col-span-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-2">Selecciona un Módulo de Futura Expansión:</span>
          {roadmapModules.map(m => {
            const Icon = m.icon;
            const isActive = activeRoadmapModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveRoadmapModule(m.id)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-gray-100 text-slate-700 ' + m.colorClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{m.label}</h4>
                    <span className={`text-[8px] block mt-0.5 ${isActive ? 'text-slate-300' : 'text-gray-400'}`}>Fase de Diseño</span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'translate-x-0.5' : 'text-gray-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Detail Content Box */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Module header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="h-12 w-12 bg-slate-50 border border-gray-150 rounded-2xl flex items-center justify-center shrink-0">
                <ActiveIcon className="h-6 w-6 text-slate-800" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">{currentModule.label}</h3>
                <p className="text-[10px] text-sky-600 font-semibold mt-0.5">{currentModule.tagline}</p>
              </div>
            </div>

            {/* Architecture description text */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Arquitectura de Integración</span>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-gray-100">
                {currentModule.architectureDesc}
              </p>
            </div>

            {/* Table and endpoints listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tables */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100/80">
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  Nuevas Tablas Postgres
                </span>
                <ul className="space-y-1">
                  {currentModule.dbTables.map(table => (
                    <li key={table} className="font-mono text-[9px] text-gray-505 font-bold flex items-center gap-1">
                      <span className="text-purple-500 font-bold">▶</span> {table}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Endpoints */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100/80">
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Link className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  API Endpoints Diseñados
                </span>
                <ul className="space-y-1">
                  {currentModule.endpoints.map(endp => (
                    <li key={endp} className="font-mono text-[9px] text-gray-505 font-bold flex items-center gap-1">
                      <span className="text-emerald-500 font-bold">●</span> {endp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Flowchart diagram presentation */}
          <div className="pt-5 mt-5 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-slate-500" />
              Estructura decoupled (acoplamiento débil) lista para integrar
            </span>
            <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[8px] uppercase">Fase 2 Dev</span>
          </div>
        </div>
      </div>
    </div>
  );
}
