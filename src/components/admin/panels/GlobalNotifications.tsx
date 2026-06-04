'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb } from '@/lib/mockDb';
import { Bell, Send, Users, Smartphone, Mail, MessageSquare, CheckCircle2, Trash2, Sparkles } from 'lucide-react';

interface CampaignLog {
  id: string;
  title: string;
  content: string;
  channels: string[];
  segments: string[];
  sent_at: string;
  delivered_count: number;
}

const INITIAL_CAMPAIGNS: CampaignLog[] = [
  { id: 'camp-1', title: 'Actualización importante del Calendario de Vacunación', content: 'Estimados padres, se ha incorporado la nueva dosis de refuerzo del virus sincitial respiratorio de forma obligatoria.', channels: ['push', 'in_app'], segments: ['mothers'], sent_at: '2026-05-28T09:30:00Z', delivered_count: 1 },
  { id: 'camp-2', title: 'Acuerdo de Socio Comercial (BAA) obligatoria para médicos', content: 'Estimados profesionales de la salud, deben convalidar sus acuerdos de privacidad firmados antes del 10 de junio.', channels: ['email'], segments: ['obstetricians', 'pediatricians'], sent_at: '2026-06-01T15:00:00Z', delivered_count: 2 }
];

export default function GlobalNotifications() {
  const [db, setDb] = useState(getMockDb());
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [pushSelected, setPushSelected] = useState(true);
  const [emailSelected, setEmailSelected] = useState(false);
  const [appSelected, setAppSelected] = useState(true);
  const [segMothers, setSegMothers] = useState(true);
  const [segObstetricians, setSegObstetricians] = useState(false);
  const [segPediatricians, setSegPediatricians] = useState(false);
  const [segPremiumOnly, setSegPremiumOnly] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignLog[]>(INITIAL_CAMPAIGNS);
  const [campaignSuccess, setCampaignSuccess] = useState(false);

  // Action: Broadcast
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) return;

    // Build lists of targets in mock db
    const targets: string[] = [];
    if (segMothers) targets.push('mother');
    if (segObstetricians) targets.push('obstetrician');
    if (segPediatricians) targets.push('pediatrician');

    // Fetch matches profile accounts in local mock db
    const matchingProfiles = db.profiles.filter(p => {
      const matchRole = targets.includes(p.role);
      
      if (segPremiumOnly) {
        const hasPremiumSub = db.subscriptions.some(s => s.user_id === p.id && s.plan_name !== 'free' && s.status === 'active');
        return matchRole && hasPremiumSub;
      }
      return matchRole;
    });

    // In-app channels injector: Push new notifications directly into db.notifications
    let updatedNotifications = [...db.notifications];
    if (appSelected) {
      matchingProfiles.forEach(profile => {
        const newNotif = {
          id: `not-${Date.now()}-${profile.id}`,
          user_id: profile.id,
          title: notifTitle,
          content: notifContent,
          type: 'system' as const,
          created_at: new Date().toISOString()
        };
        updatedNotifications = [newNotif, ...updatedNotifications];
      });
    }

    // Save mock notify events to mock db
    const updatedDb = { ...db, notifications: updatedNotifications };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    // Save to local campaigns array logs for preview
    const activeChannels: string[] = [];
    if (pushSelected) activeChannels.push('push');
    if (emailSelected) activeChannels.push('email');
    if (appSelected) activeChannels.push('in_app');

    const activeSegments: string[] = [];
    if (segMothers) activeSegments.push('mothers');
    if (segObstetricians) activeSegments.push('obstetricians');
    if (segPediatricians) activeSegments.push('pediatricians');
    if (segPremiumOnly) activeSegments.push('premium');

    const newCampaign: CampaignLog = {
      id: `camp-${Date.now()}`,
      title: notifTitle,
      content: notifContent,
      channels: activeChannels,
      segments: activeSegments,
      sent_at: new Date().toISOString(),
      delivered_count: matchingProfiles.length
    };

    setCampaigns([newCampaign, ...campaigns]);
    setCampaignSuccess(true);

    // Reset fields
    setNotifTitle('');
    setNotifContent('');

    setTimeout(() => {
      setCampaignSuccess(false);
    }, 4000);
  };

  const handleDeleteCampaign = (campId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. NOTIFICATION CREATOR FORM */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Bell className="h-5 w-5 text-slate-700 shrink-0 animate-swing" />
          Programador de Mensajería y Campañas Globales
        </h3>
        <p className="text-[10px] text-gray-400">Emite notificaciones masivas para campañas informativas o alertas críticas del sistema</p>

        {campaignSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] p-3 rounded-2xl flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            ¡Campaña masiva enviada con éxito a los canales y segmentos seleccionados!
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Choose Channels */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-3">1. Canales de Distribución</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushSelected}
                    onChange={(e) => setPushSelected(e.target.checked)}
                    className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                  />
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  Notificaciones Push Móvil
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSelected}
                    onChange={(e) => setEmailSelected(e.target.checked)}
                    className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                  />
                  <Mail className="h-4 w-4 text-gray-400" />
                  Correo Electrónico Masivo
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appSelected}
                    onChange={(e) => setAppSelected(e.target.checked)}
                    className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                  />
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  Mensaje Interno (App Banner)
                </label>
              </div>
            </div>

            {/* Choose Segments */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider block mb-3">2. Segmentación de Destinatarios</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={segMothers}
                    onChange={(e) => setSegMothers(e.target.checked)}
                    className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                  />
                  Madres / Pacientes
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={segObstetricians}
                    onChange={(e) => setSegObstetricians(e.target.checked)}
                    className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                  />
                  Médicos Obstetras
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={segPediatricians}
                    onChange={(e) => setSegPediatricians(e.target.checked)}
                    className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                  />
                  Médicos Pediatras
                </label>
                <div className="border-t border-gray-200/60 my-1 pt-1.5">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-purple-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={segPremiumOnly}
                      onChange={(e) => setSegPremiumOnly(e.target.checked)}
                      className="rounded border-purple-300 text-purple-700 focus:ring-purple-500"
                    />
                    <Sparkles className="h-3.5 w-3.5" />
                    Exclusivo: Solo Usuarios Premium
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Message */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Título de la Alerta / Campaña</label>
              <input
                type="text"
                placeholder="Ej. Mantenimiento del Servidor o Nueva Recomendación Pediátrica"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cuerpo del Mensaje</label>
              <textarea
                placeholder="Escribe el mensaje completo aquí..."
                value={notifContent}
                onChange={(e) => setNotifContent(e.target.value)}
                className="w-full h-24 bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400 resize-none leading-relaxed"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Send className="h-4.5 w-4.5" />
            Enviar Campaña Masiva
          </button>
        </form>
      </div>

      {/* 2. HISTORY OF CAMPAIGNS */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-slate-700 shrink-0" />
          Historial de Campañas
        </h3>
        <p className="text-[10px] text-gray-400">Audita las notificaciones emitidas y el total de entregas</p>

        <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
          {campaigns.map(camp => (
            <div key={camp.id} className="p-4 bg-slate-50 border border-gray-100 rounded-2xl space-y-2.5 relative">
              <button
                onClick={() => handleDeleteCampaign(camp.id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1"
                title="Eliminar del historial"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <div>
                <h4 className="font-bold text-gray-800 text-xs pr-6 leading-tight">{camp.title}</h4>
                <p className="text-[9px] text-gray-400 mt-1 leading-normal">{camp.content}</p>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase">
                {camp.channels.map(chan => <span key={chan} className="bg-slate-200 text-slate-600 px-1.5 py-0.25 rounded-md">{chan}</span>)}
                {camp.segments.map(seg => <span key={seg} className="bg-purple-100 text-purple-700 px-1.5 py-0.25 rounded-md">{seg}</span>)}
              </div>

              {/* Delivery stats */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[9px] text-gray-400 font-semibold">
                <span>Entregado a: {camp.delivered_count} usuarios</span>
                <span>{new Date(camp.sent_at).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
