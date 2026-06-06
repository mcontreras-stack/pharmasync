'use client';

import React, { useState } from 'react';
import { getMockDb } from '@/lib/mockDb';
import {
  FileDown,
  Calendar,
  Layers,
  Database,
  ArrowRight,
  Loader,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export default function SystemReports() {
  const db = getMockDb();

  // Inputs
  const [reportTarget, setReportTarget] = useState<'users' | 'doctors' | 'billing' | 'activity'>('users');
  const [reportFormat, setReportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState('30d');

  // Interactive states
  const [loading, setLoading] = useState(false);
  const [successReport, setSuccessReport] = useState<string | null>(null);

  // Helper: Create CSV data and trigger download
  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessReport(null);

    setTimeout(() => {
      let csvContent = '';
      let filename = '';

      if (reportTarget === 'users') {
        csvContent = 'ID,Nombre,Email,Rol,Estado\n';
        db.profiles.forEach(p => {
          csvContent += `"${p.id}","${p.full_name}","${p.email}","${p.role}","${p.is_suspended ? 'Suspendido' : 'Activo'}"\n`;
        });
        filename = `vitarahealth_usuarios_${Date.now()}.csv`;
      } else if (reportTarget === 'doctors') {
        csvContent = 'ID,Nombre,Especialidad,Licencia,Estado Verificacion\n';
        db.doctors.forEach(d => {
          const profile = db.profiles.find(p => p.id === d.id);
          csvContent += `"${d.id}","${profile?.full_name || 'Desconocido'}","${d.specialty}","${d.license_number}","${d.verification_status}"\n`;
        });
        filename = `vitarahealth_medicos_${Date.now()}.csv`;
      } else if (reportTarget === 'billing') {
        csvContent = 'Suscripcion ID,Usuario,Plan,Monto Pagado,Estado Pago,Vencimiento\n';
        db.subscriptions.forEach(s => {
          const profile = db.profiles.find(p => p.id === s.user_id);
          csvContent += `"${s.id}","${profile?.full_name || 'Desconocido'}","${s.plan_name}",${s.price_paid},"${s.payment_status}","${s.end_date}"\n`;
        });
        filename = `vitarahealth_facturacion_${Date.now()}.csv`;
      } else {
        csvContent = 'ID,Email,Evento,IP,Fecha,Sospechoso\n';
        db.audit_logs.forEach(log => {
          csvContent += `"${log.id}","${log.email || log.user_id || 'N/A'}","${log.event}","${log.ip_address}","${log.created_at}",${log.is_suspicious}\n`;
        });
        filename = `vitarahealth_auditoria_seguridad_${Date.now()}.csv`;
      }

      // Convert to blob and download if CSV, otherwise simulate excel/pdf download
      if (reportFormat === 'csv') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccessReport(`Reporte CSV descargado con éxito: "${filename}"`);
      } else {
        // Mock download for excel or pdf
        setSuccessReport(`Reporte tipo ${reportFormat.toUpperCase()} generado y descargado con éxito.`);
      }

      setLoading(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. EXPORT GENERATOR CONTROL FORM */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <FileDown className="h-5 w-5 text-slate-700 shrink-0" />
          Generador de Reportes y Descargas SaaS
        </h3>
        <p className="text-[10px] text-gray-400">Descarga resúmenes operacionales, bases de médicos, registros de suscripción o logs en crudo</p>

        {successReport && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] p-3 rounded-2xl flex items-center gap-2 font-bold">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            {successReport}
          </div>
        )}

        <form onSubmit={handleExport} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Select */}
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">1. Objetivo de Datos</label>
              <select
                value={reportTarget}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportTarget(e.target.value as 'users' | 'doctors' | 'billing' | 'activity')}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              >
                <option value="users">Listado de Usuarios</option>
                <option value="doctors">Listado de Médicos</option>
                <option value="billing">Pagos y Suscripciones</option>
                <option value="activity">Logs de Auditoría</option>
              </select>
            </div>

            {/* Format Select */}
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">2. Formato del Archivo</label>
              <select
                value={reportFormat}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportFormat(e.target.value as 'csv' | 'excel' | 'pdf')}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              >
                <option value="csv">Delimitado por comas (.CSV)</option>
                <option value="excel">Microsoft Excel (.XLSX)</option>
                <option value="pdf">Documento Portátil (.PDF)</option>
              </select>
            </div>

            {/* Timeframe Range */}
            <div>
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">3. Rango de Tiempo</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 3 meses</option>
                <option value="all">Histórico Completo</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-350 transition-colors shadow-xs"
          >
            {loading ? (
              <>
                <Loader className="h-4.5 w-4.5 animate-spin" />
                Compilando reporte en memoria...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4.5 w-4.5" />
                Generar y Descargar Reporte
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. RECENT EXPORTS AND TEMPLATE ARCHIVES */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Database className="h-4.5 w-4.5 text-slate-700 shrink-0" />
          Plantillas Frecuentes
        </h3>
        <p className="text-[10px] text-gray-400">Estructuras predefinidas para auditar contabilidad o actividadPHi</p>

        <div className="space-y-3">
          <div className="p-3 bg-slate-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-700 block">Reporte Mensual de MRR</span>
              <span className="text-[9px] text-gray-400 block mt-0.5">Suscripciones premium + tasa de conversión</span>
            </div>
            <button onClick={() => { setReportTarget('billing'); setReportFormat('csv'); }} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">
              <FileDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 border border-gray-100 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-700 block">Logs de Auditoría HIPAA</span>
              <span className="text-[9px] text-gray-400 block mt-0.5">Auditoría completa de acceso a registros PHI</span>
            </div>
            <button onClick={() => { setReportTarget('activity'); setReportFormat('csv'); }} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">
              <FileDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
