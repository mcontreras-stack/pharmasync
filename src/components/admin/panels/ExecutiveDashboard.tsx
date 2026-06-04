'use client';

import React from 'react';
import { getMockDb, MOCK_MOTHER_ID, MOCK_OBSTETRICIAN_ID, MOCK_PEDIATRICIAN_ID } from '@/lib/mockDb';
import { Users, TrendingUp, Heart, Baby, Activity, ArrowUpRight, ArrowDownRight, DollarSign, UserPlus, Percent, UserX, Sparkles } from 'lucide-react';

export default function ExecutiveDashboard() {
  const db = getMockDb();

  // Metric calculation
  const totalUsers = db.profiles.length;
  const mothersCount = db.profiles.filter(p => p.role === 'mother').length;
  const obsCount = db.profiles.filter(p => p.role === 'obstetrician').length;
  const pedsCount = db.profiles.filter(p => p.role === 'pediatrician').length;
  const activePregnancies = db.pregnancies.filter(p => p.status === 'active').length;
  const babiesCount = db.babies.length;
  
  // Simulated stats
  const newUsersToday = 3;
  const newUsersThisMonth = 14;
  const inactiveUsersCount = 1;
  const growthRate = '+18.4%';
  const conversionRate = '12.5%';
  const churnRate = '2.1%';

  // MRR & ARR calculation
  const activeSubs = db.subscriptions.filter(s => s.status === 'active' && s.payment_status === 'paid');
  const mrr = activeSubs.reduce((acc, sub) => {
    if (sub.plan_name === 'premium_monthly') return acc + sub.price_paid;
    if (sub.plan_name === 'premium_yearly') return acc + (sub.price_paid / 12);
    return acc;
  }, 0);
  const arr = mrr * 12;

  // Chart data definitions (Simulating last 6 months)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const userGrowthData = [4, 8, 12, 18, 25, totalUsers]; // accumulative
  const revenueGrowthData = [40, 80, 110, 150, 190, mrr]; // Monthly MRR
  const pregnancyData = [1, 2, 2, 3, 3, activePregnancies]; 
  const babyData = [0, 1, 1, 2, 3, babiesCount];
  const dailyActivityData = [12, 25, 19, 32, 45, 38]; // daily api request counts

  // Custom responsive SVG line chart drawer
  const renderAreaChart = (data: number[], colorClass: string, gradientId: string, maxVal: number) => {
    const width = 500;
    const height = 150;
    const padding = 20;
    
    // Generate SVG path coordinates
    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      // invert Y coordinate for SVG system (0,0 is top-left)
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Close the area path for gradient filling
    const areaPath = `
      ${linePath} 
      L ${points[points.length - 1].x} ${height - padding} 
      L ${points[0].x} ${height - padding} 
      Z
    `;

    return (
      <svg className="w-full h-36" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorClass} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colorClass} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Shaded Area */}
        <path d={areaPath} fill={`url(#${gradientId})`} />
        {/* Stroke Line */}
        <path d={linePath} fill="none" stroke={colorClass} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke={colorClass} strokeWidth="2.5" className="hover:r-6 cursor-pointer transition-all" />
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP CARDS STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Usuarios Totales</span>
            <div className="h-8 w-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalUsers}</span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              {growthRate}
            </span>
          </div>
          <span className="text-[9px] text-gray-400 mt-1 block">+{newUsersThisMonth} este mes ({newUsersToday} hoy)</span>
        </div>

        {/* Card 2: MRR */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ingresos Mensuales (MRR)</span>
            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">${mrr.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              +15.2%
            </span>
          </div>
          <span className="text-[9px] text-gray-400 mt-1 block">ARR Estimado: ${arr.toFixed(2)}/año</span>
        </div>

        {/* Card 3: Conversión */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Free → Premium</span>
            <div className="h-8 w-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600">{conversionRate}</span>
            <span className="text-[10px] text-purple-500 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              +1.8%
            </span>
          </div>
          <span className="text-[9px] text-gray-400 mt-1 block">Tasa de conversión acumulada</span>
        </div>

        {/* Card 4: Churn & Inactividad */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tasa de Churn</span>
            <div className="h-8 w-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{churnRate}</span>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" />
              -0.3%
            </span>
          </div>
          <span className="text-[9px] text-gray-400 mt-1 block">{inactiveUsersCount} usuario inactivo detectado</span>
        </div>
      </div>

      {/* 2. SPECIFIC SUB-SEGMENT COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mothers Card */}
        <div className="bg-white/80 rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center shrink-0">
            <Heart className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block">Madres Registradas</span>
            <span className="text-base font-black text-gray-800">{mothersCount}</span>
          </div>
        </div>

        {/* Pregnancies Card */}
        <div className="bg-white/80 rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block">Embarazos Activos</span>
            <span className="text-base font-black text-gray-800">{activePregnancies}</span>
          </div>
        </div>

        {/* Babies Card */}
        <div className="bg-white/80 rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Baby className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block">Bebés en Seguimiento</span>
            <span className="text-base font-black text-gray-800">{babiesCount}</span>
          </div>
        </div>

        {/* Medical Staff Card */}
        <div className="bg-white/80 rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block">Médicos (Obst/Ped)</span>
            <span className="text-base font-black text-gray-800">{obsCount + pedsCount} <span className="text-[9px] text-gray-400 font-normal">({obsCount} OB / {pedsCount} PD)</span></span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-800">Crecimiento de Usuarios</h3>
              <p className="text-[10px] text-gray-400">Evolución acumulada de registros activos</p>
            </div>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md">6 Meses</span>
          </div>
          {renderAreaChart(userGrowthData, '#6366f1', 'userGrad', 30)}
          <div className="flex justify-between mt-2 px-6 text-[9px] text-gray-400 font-semibold">
            {months.map((m, idx) => (
              <div key={m} className="text-center">
                <span>{m}</span>
                <span className="block text-[8px] font-bold text-slate-600">({userGrowthData[idx]})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Growth Chart */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-800">Crecimiento de Ingresos (MRR)</h3>
              <p className="text-[10px] text-gray-400">Facturación mensual estimada recurrentes en USD</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">6 Meses</span>
          </div>
          {renderAreaChart(revenueGrowthData, '#10b981', 'revenueGrad', 250)}
          <div className="flex justify-between mt-2 px-6 text-[9px] text-gray-400 font-semibold">
            {months.map((m, idx) => (
              <div key={m} className="text-center">
                <span>{m}</span>
                <span className="block text-[8px] font-bold text-slate-600">${revenueGrowthData[idx].toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Funnel Growth */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-800">Nuevos Embarazos y Nacimientos</h3>
              <p className="text-[10px] text-gray-400">Contraste de procesos de maternidad por mes</p>
            </div>
            <div className="flex gap-2 text-[9px] font-semibold">
              <span className="text-purple-600">● Embarazos</span>
              <span className="text-emerald-600">● Bebés</span>
            </div>
          </div>
          {renderAreaChart(pregnancyData, '#a855f7', 'pregGrad', 5)}
          <div className="flex justify-between mt-2 px-6 text-[9px] text-gray-400 font-semibold">
            {months.map((m, idx) => (
              <div key={m} className="text-center">
                <span>{m}</span>
                <span className="block text-[8px] font-bold text-slate-600">🤰{pregnancyData[idx]} | 👶{babyData[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily API & Server Activity */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-800">Actividad Diaria de la Plataforma</h3>
              <p className="text-[10px] text-gray-400">Peticiones de red e interacción de usuarios en tiempo real</p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md animate-pulse">● En Vivo</span>
          </div>
          {renderAreaChart(dailyActivityData, '#f59e0b', 'activityGrad', 50)}
          <div className="flex justify-between mt-2 px-6 text-[9px] text-gray-400 font-semibold">
            {months.map((m, idx) => (
              <div key={m} className="text-center">
                <span>{m}</span>
                <span className="block text-[8px] font-bold text-slate-600">{dailyActivityData[idx]}k reqs</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
