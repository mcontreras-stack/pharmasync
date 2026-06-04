'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import {
  Cpu,
  Sparkles,
  TrendingUp,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function AiAutomation() {
  const db = getMockDb();
  const [successSave, setSuccessSave] = useState(false);

  // Form API Keys
  const [openaiKey, setOpenaiKey] = useState('sk-proj-...ytr4');
  const [claudeKey, setClaudeKey] = useState('sk-ant-...h983');
  const [openaiLimit, setOpenaiLimit] = useState('$50.00');
  const [claudeLimit, setClaudeLimit] = useState('$100.00');

  // Automated crons states
  const [autoVaccineCheck, setAutoVaccineCheck] = useState(true);
  const [autoPrenatalAlerts, setAutoPrenatalAlerts] = useState(true);
  const [autoChatSummaries, setAutoChatSummaries] = useState(false);

  // Stats
  const totalCalls = db.ai_usage_stats.length;
  const totalCost = db.ai_usage_stats.reduce((acc, c) => acc + c.cost_usd, 0);

  const handleSaveAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessSave(true);
    setTimeout(() => {
      setSuccessSave(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total calls */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Llamadas API IA</span>
            <span className="text-xl font-black text-gray-800">{totalCalls}</span>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Costo Estimado</span>
            <span className="text-xl font-black text-emerald-600">${totalCost.toFixed(4)}</span>
          </div>
        </div>

        {/* OpenAI Budget */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Límite OpenAI</span>
            <span className="text-sm font-black text-slate-800">{openaiLimit}/mes</span>
          </div>
        </div>

        {/* Claude Budget */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Límite Claude</span>
            <span className="text-sm font-black text-slate-800">{claudeLimit}/mes</span>
          </div>
        </div>
      </div>

      {successSave && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] p-3 rounded-2xl flex items-center gap-2 font-bold animate-pulse">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
          ¡Configuración de automatizaciones e IA guardada con éxito!
        </div>
      )}

      {/* 2. AUTOMATION RULES TOGGLES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-slate-700 shrink-0" />
            Motores de Reglas y Automatización (Crons)
          </h3>
          <p className="text-[10px] text-gray-400">Configura crons y reglas automatizadas del servidor para interactuar con pacientes</p>

          <div className="space-y-4 pt-2">
            {/* Rule 1: Vaccine Check */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-100 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Recordatorio de Vacunas Automatizado</span>
                <span className="text-[10px] text-gray-450 mt-0.5 leading-normal block max-w-md">Evalúa semanalmente el calendario de vacunas de los bebés y envía una alerta push si se acerca una fecha de dosis.</span>
              </div>
              <button onClick={() => setAutoVaccineCheck(!autoVaccineCheck)}>
                {autoVaccineCheck ? (
                  <ToggleRight className="h-9 w-9 text-slate-800" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-gray-300" />
                )}
              </button>
            </div>

            {/* Rule 2: Prenatal checks */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-100 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Alertas de Vómitos y Presión Prenatal</span>
                <span className="text-[10px] text-gray-450 mt-0.5 leading-normal block max-w-md">Envía alertas de cuidado automáticas si una madre registra síntomas de intensidad "Alta" o valores de presión sistólica &gt; 130.</span>
              </div>
              <button onClick={() => setAutoPrenatalAlerts(!autoPrenatalAlerts)}>
                {autoPrenatalAlerts ? (
                  <ToggleRight className="h-9 w-9 text-slate-800" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-gray-300" />
                )}
              </button>
            </div>

            {/* Rule 3: Summaries */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-100 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Resúmenes Clínicos Inteligentes (LLM)</span>
                <span className="text-[10px] text-gray-450 mt-0.5 leading-normal block max-w-md">Genera de forma asíncrona un resumen clínico estructurado de los chats de pacientes antes de la consulta presencial.</span>
              </div>
              <button onClick={() => setAutoChatSummaries(!autoChatSummaries)}>
                {autoChatSummaries ? (
                  <ToggleRight className="h-9 w-9 text-slate-800" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3. TOKENS CONSUMPTION LOGS */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-slate-700 shrink-0" />
            Consumo en Tiempo Real
          </h3>
          <p className="text-[10px] text-gray-400">Detalle de llamadas de API por usuario</p>

          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
            {db.ai_usage_stats.map(usage => (
              <div key={usage.id} className="p-3 bg-slate-50 border border-gray-100 rounded-2xl text-[10px]">
                <div className="flex justify-between font-bold text-slate-750">
                  <span>Usuario: {usage.user_name}</span>
                  <span className="text-purple-600 font-mono capitalize">{usage.model}</span>
                </div>
                <p className="text-gray-450 mt-1">Tokens: {usage.tokens_prompt} prompt / {usage.tokens_completion} compl.</p>
                <div className="flex justify-between mt-2 pt-1.5 border-t border-gray-150/60 font-semibold text-gray-400 text-[9px]">
                  <span className="text-emerald-600">Costo: ${usage.cost_usd.toFixed(5)}</span>
                  <span>{new Date(usage.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
