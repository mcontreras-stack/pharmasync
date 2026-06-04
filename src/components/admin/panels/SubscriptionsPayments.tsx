'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, Subscription } from '@/lib/mockDb';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  Sparkles,
  RotateCcw,
  UserMinus,
  CheckCircle,
  AlertTriangle,
  History,
  TrendingDown
} from 'lucide-react';

export default function SubscriptionsPayments() {
  const [db, setDb] = useState(getMockDb());

  // Plan level configuration
  const plans = [
    { name: 'free', label: 'Plan Free', price: '$0.00', target: 'Madres y Doctores Básicos' },
    { name: 'premium_monthly', label: 'Premium Mensual', price: '$19.99/mes', target: 'Madres (Seguimiento ilimitado)' },
    { name: 'premium_yearly', label: 'Premium Anual', price: '$149.99/año', target: 'Madres (Ahorro 37%)' },
    { name: 'professional', label: 'Plan Profesional', price: '$49.99/mes', target: 'Médicos Independientes' },
    { name: 'clinic', label: 'Plan Clínica', price: '$299.99/mes', target: 'Centros Médicos y Policonsultorios' }
  ];

  // Business calculations
  const totalSubscribers = db.subscriptions.length;
  const activeSubs = db.subscriptions.filter(s => s.status === 'active' && s.payment_status === 'paid');
  
  // MRR sum
  const mrr = activeSubs.reduce((acc, sub) => {
    if (sub.plan_name === 'premium_monthly') return acc + sub.price_paid;
    if (sub.plan_name === 'premium_yearly') return acc + (sub.price_paid / 12);
    return acc;
  }, 0);
  const arr = mrr * 12;

  // Simulated metrics
  const ltvVal = '$280.00';
  const cacVal = '$42.50';
  const ltvCacRatio = '6.5x';
  const churnVal = '2.1%';

  // Action: Refund
  const handleRefund = (subId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas reembolsar el pago de esta suscripción? Esto cambiará el estado a Reembolsado.')) return;

    const updatedSubscriptions = db.subscriptions.map(s => {
      if (s.id === subId) {
        // Send notification to user
        const newNotification = {
          id: `not-${Date.now()}`,
          user_id: s.user_id,
          title: 'Reembolso de pago aprobado',
          content: `Hemos procesado tu solicitud de reembolso de $${s.price_paid} con éxito. El dinero se acreditará en tu cuenta en 3-5 días hábiles.`,
          type: 'system' as const,
          created_at: new Date().toISOString()
        };
        db.notifications = [newNotification, ...db.notifications];

        return { ...s, payment_status: 'refunded' as const, status: 'canceled' as const };
      }
      return s;
    });

    const updatedDb = { ...db, subscriptions: updatedSubscriptions };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  // Action: Cancel Subscription
  const handleCancelSubscription = (subId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar la suscripción de este usuario? Perderá el acceso premium al finalizar el período actual.')) return;

    const updatedSubscriptions = db.subscriptions.map(s => {
      if (s.id === subId) {
        // Send notification to user
        const newNotification = {
          id: `not-${Date.now()}`,
          user_id: s.user_id,
          title: 'Suscripción cancelada con éxito',
          content: 'Tu plan actual ha sido cancelado. Seguirás teniendo acceso a las herramientas premium hasta la fecha de vencimiento original.',
          type: 'system' as const,
          created_at: new Date().toISOString()
        };
        db.notifications = [newNotification, ...db.notifications];

        return { ...s, status: 'canceled' as const };
      }
      return s;
    });

    const updatedDb = { ...db, subscriptions: updatedSubscriptions };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  return (
    <div className="space-y-6">
      {/* 1. SAAS METRICS BLOCK */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric MRR */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Ingreso Recurrente (MRR)</span>
          <span className="text-xl font-black text-slate-800 block mt-2">${mrr.toFixed(2)}</span>
          <span className="text-[8px] text-emerald-500 font-bold flex items-center mt-1">● Activo</span>
        </div>

        {/* Metric ARR */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Recurrencia Anual (ARR)</span>
          <span className="text-xl font-black text-slate-800 block mt-2">${arr.toFixed(2)}</span>
          <span className="text-[8px] text-gray-400 block mt-1">MRR proyectado a 12 meses</span>
        </div>

        {/* Metric LTV */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Lifetime Value (LTV)</span>
          <span className="text-xl font-black text-slate-800 block mt-2">{ltvVal}</span>
          <span className="text-[8px] text-emerald-500 font-bold flex items-center mt-1">Relación LTV/CAC: {ltvCacRatio}</span>
        </div>

        {/* Metric CAC */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Costo Adquisición (CAC)</span>
          <span className="text-xl font-black text-slate-800 block mt-2">{cacVal}</span>
          <span className="text-[8px] text-gray-400 block mt-1">Costo promedio de ads y marketing</span>
        </div>

        {/* Metric Churn Rate */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Churn Rate (Fuga)</span>
          <span className="text-xl font-black text-rose-600 block mt-2">{churnVal}</span>
          <span className="text-[8px] text-emerald-500 font-bold flex items-center mt-1">
            <TrendingDown className="h-3 w-3 inline shrink-0" />
            -0.2% vs mes anterior
          </span>
        </div>
      </div>

      {/* 2. PLANS CONFIGURATION MODULE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-slate-700 shrink-0" />
          Configuración y Catálogo de Planes Comerciales
        </h3>
        <p className="text-[10px] text-gray-400">Planes definidos en pasarelas de pago externas (Stripe / PayPal)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {plans.map(p => (
            <div key={p.name} className="p-4 bg-slate-50 border border-gray-150 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">{p.label}</span>
                <span className="text-[8px] text-gray-400 block mt-0.5">{p.target}</span>
              </div>
              <span className="text-sm font-black text-slate-900 block mt-3">{p.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SUBSCRIBERS BILLING LOG TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-slate-750 shrink-0" />
          Bitácora Detallada de Suscriptores y Auditoría de Facturación
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="py-3 px-4">Suscriptor</th>
                <th className="py-3 px-4">Plan Habilitado</th>
                <th className="py-3 px-4">Monto Facturado</th>
                <th className="py-3 px-4">Estado Recibo</th>
                <th className="py-3 px-4">Vencimiento</th>
                <th className="py-3 px-4">Días Restantes</th>
                <th className="py-3 px-4 text-center">Acciones Contables</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {db.subscriptions.map(sub => {
                const profile = db.profiles.find(p => p.id === sub.user_id);
                if (!profile) return null;

                const daysRemaining = Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                const formattedExpiry = new Date(sub.end_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

                return (
                  <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* Subscriber */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-gray-700 block">{profile.full_name}</span>
                      <span className="text-[10px] text-gray-450 block mt-0.5">{profile.email} • {profile.role === 'mother' ? 'Madre' : 'Médico'}</span>
                    </td>

                    {/* Plan */}
                    <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                      {sub.plan_name.replace('_', ' ')}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-black text-slate-800">${sub.price_paid.toFixed(2)}</td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${sub.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : sub.payment_status === 'refunded' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700 animate-pulse'}`}>
                        {sub.payment_status === 'paid' ? 'Pagado' : sub.payment_status === 'refunded' ? 'Reembolsado' : 'Impago'}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="py-3 px-4 text-gray-500 font-semibold">{formattedExpiry}</td>

                    {/* Days left */}
                    <td className="py-3 px-4 font-bold">
                      {sub.plan_name === 'free' ? (
                        <span className="text-gray-400 font-medium">--</span>
                      ) : sub.status === 'canceled' ? (
                        <span className="text-rose-500 flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Cancelado ({daysRemaining}d)
                        </span>
                      ) : daysRemaining <= 5 ? (
                        <span className="text-rose-600 flex items-center gap-0.5 font-black animate-pulse">
                          <Clock className="h-3 w-3 shrink-0" />
                          {daysRemaining} días
                        </span>
                      ) : (
                        <span className="text-slate-850 font-bold">{daysRemaining} días</span>
                      )}
                    </td>

                    {/* Billing Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {sub.plan_name !== 'free' && sub.payment_status === 'paid' && (
                          <>
                            <button
                              onClick={() => handleRefund(sub.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg hover:bg-amber-100 text-[10px] font-bold transition-colors"
                              title="Reembolsar el pago"
                            >
                              <RotateCcw className="h-3 w-3 shrink-0" />
                              Reembolsar
                            </button>

                            {sub.status !== 'canceled' && (
                              <button
                                onClick={() => handleCancelSubscription(sub.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 text-[10px] font-bold transition-colors"
                                title="Cancelar suscripción"
                              >
                                <UserMinus className="h-3 w-3 shrink-0" />
                                Cancelar
                              </button>
                            )}
                          </>
                        )}
                        {sub.plan_name === 'free' && (
                          <span className="text-[10px] text-gray-400 italic">Sin acciones</span>
                        )}
                        {sub.payment_status === 'refunded' && (
                          <span className="text-[10px] text-slate-400">Reembolsado</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
