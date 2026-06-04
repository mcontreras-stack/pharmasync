'use client';

import React, { useState } from 'react';
import {
  Settings,
  Mail,
  MessageSquare,
  Lock,
  Globe,
  Palette,
  Save,
  CheckCircle,
  Link,
  ShieldCheck
} from 'lucide-react';

export default function GeneralConfiguration() {
  const [successMsg, setSuccessMsg] = useState(false);

  // Form states
  const [platformName, setPlatformName] = useState('PharmaSync Mom & Baby');
  const [smtpServer, setSmtpServer] = useState('smtp.sendgrid.net');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('apikey');
  const [waWebhook, setWaWebhook] = useState('https://api.twilio.com/2010-04-01/Accounts/...');

  // Integrations toggles
  const [enableSupabase, setEnableSupabase] = useState(true);
  const [enableWhatsApp, setEnableWhatsApp] = useState(true);
  const [enableSmsAlerts, setEnableSmsAlerts] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
      <div>
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-750 shrink-0" />
          Configuración General de la Plataforma
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Controla la marca blanca, pasarelas SMTP, webhooks de WhatsApp e integraciones externas</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] p-3 rounded-2xl flex items-center gap-2 font-bold animate-pulse">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
          ¡Configuración del sistema guardada con éxito!
        </div>
      )}

      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* SECTION 1: BRANDING */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-gray-400" />
            1. Marca y Apariencia (White-Label)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre de la Plataforma</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                required
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Tema HSL Base</label>
              <select className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400">
                <option value="default">Multicolor (Rosa Madre / Esmeralda Pediatra)</option>
                <option value="corporate">Azul Clínico Salud</option>
                <option value="minimal">Gris Neutro Oscuro</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: SMTP CONFIG */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-gray-400" />
            2. Servidor de Correo SMTP (Notificaciones de Alerta)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Host de SMTP</label>
              <input
                type="text"
                value={smtpServer}
                onChange={(e) => setSmtpServer(e.target.value)}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Puerto</label>
              <input
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Usuario / API Key</label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: WHATSAPP WEBHOOK */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            3. API de WhatsApp (Mensajería de Citas & Recordatorios)
          </h4>
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Twilio o Webhook URL de Meta API</label>
            <input
              type="text"
              value={waWebhook}
              onChange={(e) => setWaWebhook(e.target.value)}
              className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>
        </div>

        {/* SECTION 4: INTEGRATIONS TOGGLES */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
            <Link className="h-4 w-4 text-gray-400" />
            4. Habilitar Integraciones SaaS en Vivo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Toggle 1: Supabase */}
            <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">Sincronización Supabase</span>
                <span className="text-[8px] text-gray-405">Base de datos PostgreSQL real</span>
              </div>
              <input
                type="checkbox"
                checked={enableSupabase}
                onChange={(e) => setEnableSupabase(e.target.checked)}
                className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
              />
            </div>

            {/* Toggle 2: WhatsApp */}
            <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">WhatsApp Gateway</span>
                <span className="text-[8px] text-gray-405">Envío de recordatorios automáticos</span>
              </div>
              <input
                type="checkbox"
                checked={enableWhatsApp}
                onChange={(e) => setEnableWhatsApp(e.target.checked)}
                className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
              />
            </div>

            {/* Toggle 3: SMS Alerts */}
            <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">Alertas por Mensaje SMS</span>
                <span className="text-[8px] text-gray-405">Bypass de respaldo para alertas críticas</span>
              </div>
              <input
                type="checkbox"
                checked={enableSmsAlerts}
                onChange={(e) => setEnableSmsAlerts(e.target.checked)}
                className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Save className="h-4.5 w-4.5" />
          Guardar Configuración del Negocio
        </button>
      </form>
    </div>
  );
}
