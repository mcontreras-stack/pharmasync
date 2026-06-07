'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, TrendingUp, Heart, Baby, Activity, DollarSign, UserPlus, Percent, UserX, Loader2 } from 'lucide-react';

type Stats = {
  totalUsers: number;
  mothersCount: number;
  obsCount: number;
  pedsCount: number;
  adminsCount: number;
  approvedCount: number;
  pendingCount: number;
  suspendedCount: number;
};

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('profiles')
          .select('role, status');

        if (err) throw err;

        const profiles = data || [];
        setStats({
          totalUsers:    profiles.length,
          mothersCount:  profiles.filter(p => p.role === 'mother').length,
          obsCount:      profiles.filter(p => p.role === 'obstetrician').length,
          pedsCount:     profiles.filter(p => p.role === 'pediatrician').length,
          adminsCount:   profiles.filter(p => p.role === 'admin').length,
          approvedCount: profiles.filter(p => p.status === 'approved').length,
          pendingCount:  profiles.filter(p => ['under_review', 'email_pending', 'pending_documents'].includes(p.status)).length,
          suspendedCount:profiles.filter(p => p.status === 'suspended').length,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2">
        <p className="text-sm font-bold text-rose-700">No se pudieron cargar las estadísticas</p>
        <p className="text-xs text-rose-500">{error}</p>
        <p className="text-[11px] text-rose-400">Asegúrate de haber ejecutado el <strong>supabase-setup.sql</strong> y que las políticas RLS estén activas.</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Usuarios Totales',
      value: stats.totalUsers,
      sub: `${stats.approvedCount} activos · ${stats.pendingCount} en revisión`,
      icon: Users,
      iconBg: 'bg-slate-50 text-slate-600',
    },
    {
      label: 'Madres Registradas',
      value: stats.mothersCount,
      sub: 'Perfiles de madres en la plataforma',
      icon: Heart,
      iconBg: 'bg-pink-50 text-pink-600',
    },
    {
      label: 'Médicos (Obst/Ped)',
      value: stats.obsCount + stats.pedsCount,
      sub: `${stats.obsCount} Obstetras · ${stats.pedsCount} Pediatras`,
      icon: Activity,
      iconBg: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Cuentas Suspendidas',
      value: stats.suspendedCount,
      sub: 'Usuarios con acceso bloqueado',
      icon: UserX,
      iconBg: 'bg-rose-50 text-rose-600',
    },
  ];

  const breakdown = [
    { label: 'Aprobados',        value: stats.approvedCount,  color: 'bg-emerald-500' },
    { label: 'En Revisión',      value: stats.pendingCount,   color: 'bg-amber-500' },
    { label: 'Suspendidos',      value: stats.suspendedCount, color: 'bg-rose-500' },
    { label: 'Admins',           value: stats.adminsCount,    color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{card.label}</span>
              <div className={`h-8 w-8 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800">{card.value}</span>
            </div>
            <span className="text-[9px] text-gray-400 mt-1 block">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <h3 className="text-xs font-black text-slate-800 mb-4">Distribución por Estado de Cuenta</h3>
        {stats.totalUsers === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-400">Sin usuarios registrados</p>
            <p className="text-[11px] text-slate-300">Cuando los usuarios se registren, aparecerán las estadísticas aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {breakdown.map(b => (
                <div
                  key={b.label}
                  className={`${b.color} transition-all`}
                  style={{ width: `${stats.totalUsers > 0 ? (b.value / stats.totalUsers) * 100 : 0}%` }}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {breakdown.map(b => (
                <div key={b.label} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${b.color} shrink-0`} />
                  <div>
                    <p className="text-[9px] text-gray-400 font-semibold">{b.label}</p>
                    <p className="text-sm font-black text-slate-800">{b.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <h3 className="text-xs font-black text-slate-800 mb-4">Usuarios por Tipo de Perfil</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Madres',     count: stats.mothersCount,   color: 'text-pink-600',    bg: 'bg-pink-50' },
            { label: 'Obstetras',  count: stats.obsCount,       color: 'text-sky-600',     bg: 'bg-sky-50' },
            { label: 'Pediatras',  count: stats.pedsCount,      color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Admins',     count: stats.adminsCount,    color: 'text-slate-700',   bg: 'bg-slate-50' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${item.color}`}>{item.count}</p>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        Datos en tiempo real desde Supabase · Actualizado al cargar esta página
      </p>
    </div>
  );
}
