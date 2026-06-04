'use client';

import React from 'react';
import { getMockDb } from '@/lib/mockDb';
import {
  Activity,
  Heart,
  Baby,
  Syringe,
  Clipboard,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  TrendingDown
} from 'lucide-react';

export default function MedicalAnalytics() {
  const db = getMockDb();

  // Calculations
  const activePregnancies = db.pregnancies.filter(p => p.status === 'active').length;
  const completedPregnancies = db.pregnancies.filter(p => p.status === 'completed').length;
  const totalBabies = db.babies.length;
  
  const prenatalVisitsCount = db.prenatal_visits.length;
  const pediatricVisitsCount = db.pediatric_visits.length;
  const appliedVaccinesCount = db.baby_vaccines.filter(v => v.status === 'applied').length;
  const pendingVaccinesCount = db.baby_vaccines.filter(v => v.status === 'pending').length;

  // Monthly stats for graph (last 6 months)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const prenatalVisitsData = [2, 3, 5, 8, 12, prenatalVisitsCount];
  const pediatricVisitsData = [1, 2, 2, 3, 4, pediatricVisitsCount];
  const vaccinesAppliedData = [5, 12, 18, 25, 32, appliedVaccinesCount];

  // Helper to draw an SVG grouped bar chart (Prenatal vs Pediatric visits)
  const renderBarChart = (group1: number[], group2: number[], maxVal: number) => {
    const width = 500;
    const height = 150;
    const padding = 20;
    const barWidth = 14;
    const gap = 4;

    const numGroups = group1.length;
    const plotWidth = width - padding * 2;
    const sectionWidth = plotWidth / numGroups;

    return (
      <svg className="w-full h-36" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Draw background grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = height - padding - ratio * (height - padding * 2);
          return (
            <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
          );
        })}

        {/* Draw bars */}
        {group1.map((val1, index) => {
          const val2 = group2[index];
          
          const centerX = padding + index * sectionWidth + sectionWidth / 2;
          const x1 = centerX - barWidth - gap / 2;
          const x2 = centerX + gap / 2;

          const h1 = (val1 / maxVal) * (height - padding * 2);
          const h2 = (val2 / maxVal) * (height - padding * 2);

          const y1 = height - padding - h1;
          const y2 = height - padding - h2;

          return (
            <g key={index}>
              {/* Bar 1 (Prenatal) */}
              <rect
                x={x1}
                y={y1}
                width={barWidth}
                height={h1}
                fill="#a855f7" // Purple
                rx="3"
                className="hover:opacity-90 cursor-pointer transition-opacity"
              />
              {/* Bar 2 (Pediatric) */}
              <rect
                x={x2}
                y={y2}
                width={barWidth}
                height={h2}
                fill="#10b981" // Emerald
                rx="3"
                className="hover:opacity-90 cursor-pointer transition-opacity"
              />
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" />
      </svg>
    );
  };

  // Helper to draw SVG line area chart
  const renderAreaChart = (data: number[], maxVal: number, color: string, gradId: string) => {
    const width = 500;
    const height = 150;
    const padding = 20;

    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <svg className="w-full h-36" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke={color} strokeWidth="2" />
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. HIPAA DISCLAIMER HEADER */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-gray-800 shadow-sm flex items-start gap-4">
        <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Panel de Inteligencia Médica Anonimizada</h4>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            De acuerdo con las regulaciones de la norma HIPAA de privacidad (Privacy Rule) y protección de Datos de Salud Protegidos (PHI), todos los indicadores de este panel se calculan de manera agregada, anonimizada y no rastreable. No se expone información personal ni de identidad clínica directa en esta consola de negocios.
          </p>
        </div>
      </div>

      {/* 2. AGGREGATED METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active vs completed pregnancies */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Embarazos Gestionados</span>
            <span className="text-sm font-black text-gray-855">
              {activePregnancies} Activos <span className="text-[10px] font-medium text-gray-400">/ {completedPregnancies} Cursados</span>
            </span>
          </div>
        </div>

        {/* Babies count */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Baby className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Bebés Nacidos</span>
            <span className="text-base font-black text-gray-800">{totalBabies}</span>
          </div>
        </div>

        {/* Total doctor appointments */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Clipboard className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Consultas Totales</span>
            <span className="text-base font-black text-gray-800">{prenatalVisitsCount + pediatricVisitsCount}</span>
          </div>
        </div>

        {/* Total vaccines */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
            <Syringe className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Vacunas Aplicadas</span>
            <span className="text-sm font-black text-slate-805">
              {appliedVaccinesCount} dosis <span className="text-[10px] text-gray-400 font-medium">({pendingVaccinesCount} pdtes)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits volume bar chart */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800">Volumen de Consultas Médicas</h3>
              <p className="text-[10px] text-gray-400">Distribución de checkups por mes</p>
            </div>
            <div className="flex gap-2 text-[9px] font-bold">
              <span className="text-purple-600">■ Obstetras</span>
              <span className="text-emerald-600">■ Pediatras</span>
            </div>
          </div>
          {renderBarChart(prenatalVisitsData, pediatricVisitsData, 15)}
          <div className="flex justify-between mt-2 px-6 text-[9px] text-gray-400 font-semibold">
            {months.map((m, idx) => (
              <div key={m} className="text-center">
                <span>{m}</span>
                <span className="block text-[8px] font-bold text-slate-650">🏣{prenatalVisitsData[idx]} | 🚼{pediatricVisitsData[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vaccines Area Chart */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-800">Campañas de Vacunación Completas</h3>
              <p className="text-[10px] text-gray-400">Total acumulado de dosis administradas a bebés</p>
            </div>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md">Histórico</span>
          </div>
          {renderAreaChart(vaccinesAppliedData, 40, '#0284c7', 'vaccGrad')}
          <div className="flex justify-between mt-2 px-6 text-[9px] text-gray-400 font-semibold">
            {months.map((m, idx) => (
              <div key={m} className="text-center">
                <span>{m}</span>
                <span className="block text-[8px] font-bold text-slate-600">{vaccinesAppliedData[idx]} dosis</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
