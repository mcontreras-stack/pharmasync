'use client';

import React, { useState } from 'react';
import { getMockDb } from '@/lib/mockDb';
import { ShieldAlert, CheckCircle2, AlertOctagon, Activity, FileText, ClipboardList } from 'lucide-react';

export default function QualityDashboard() {
  const db = getMockDb();
  
  // Compliance KPIs
  const totalDoctors = db.doctors?.length || 0;
  const approvedDoctors = db.doctors?.filter(d => d.verification_status === 'approved').length || 0;
  const approvalRate = totalDoctors > 0 ? ((approvedDoctors / totalDoctors) * 100).toFixed(1) : '100.0';

  const totalPatients = db.mothers?.length || 0;
  const patientsWithHistory = db.clinical_histories?.length || 0;
  const historyComplianceRate = totalPatients > 0 ? ((patientsWithHistory / totalPatients) * 100).toFixed(1) : '100.0';

  // Log counts
  const recentAudits = db.audit_logs?.slice(0, 15) || [];
  const securityAlerts = db.security_events?.filter(e => e.severity === 'high' || e.severity === 'critical') || [];

  return (
    <div className="space-y-6 select-none text-left">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Verification Compliance */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Aprobación Médica</span>
            <span className="text-sm font-black text-slate-800">
              {approvalRate}% <span className="text-[9px] font-semibold text-gray-450">({approvedDoctors}/{totalDoctors} docs)</span>
            </span>
          </div>
        </div>

        {/* Clinical Records compliance */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Expedientes Completos</span>
            <span className="text-sm font-black text-slate-800">
              {historyComplianceRate}% <span className="text-[9px] font-semibold text-gray-455">({patientsWithHistory}/{totalPatients} pacs)</span>
            </span>
          </div>
        </div>

        {/* HIPAA Security Warnings */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
            securityAlerts.length > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-500'
          }`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Eventos de Riesgo HIPAA</span>
            <span className="text-sm font-black text-slate-850">
              {securityAlerts.length} <span className="text-[9px] font-semibold text-gray-400">alertas detectadas</span>
            </span>
          </div>
        </div>
      </div>

      {/* SVG compliance chart */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-pink-500" />
            Cumplimiento Calidad Médica
          </h3>
          <p className="text-[10px] text-gray-400">Comparativa porcentual de estándares de calidad regulados</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 justify-around pt-2">
          {/* Radial progress for Doctor verification */}
          <div className="text-center space-y-2">
            <div className="relative h-24 w-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="48" cy="48" r="40" stroke="#10b981" strokeWidth="8" fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * parseFloat(approvalRate)) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-slate-800">
                {approvalRate}%
              </div>
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Verificación Docs</span>
          </div>

          {/* Radial progress for Clinical history compliance */}
          <div className="text-center space-y-2">
            <div className="relative h-24 w-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="48" cy="48" r="40" stroke="#a855f7" strokeWidth="8" fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * parseFloat(historyComplianceRate)) / 100}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-slate-800">
                {historyComplianceRate}%
              </div>
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Expediente Completo</span>
          </div>
        </div>
      </div>

      {/* Real-time Audit logs */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
          <ClipboardList className="h-4.5 w-4.5 text-indigo-500" />
          Historial Auditado de Cambios de Salud (HIPAA)
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {recentAudits.map((audit) => (
            <div key={audit.id} className="bg-slate-50 border border-gray-150 p-3 rounded-2xl text-[10px] space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-800 uppercase tracking-wider">{audit.action?.replace(/_/g, ' ')}</span>
                <span className="text-gray-400 font-bold">{new Date(audit.created_at).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-gray-500 font-semibold leading-relaxed">
                <div>
                  <span className="text-gray-400 font-bold uppercase block text-[8px]">Tabla afectada:</span>
                  <span className="text-slate-700 font-bold">{audit.table_affected}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold uppercase block text-[8px]">Usuario / Auditor:</span>
                  <span className="text-slate-700 font-bold">{audit.user_email} ({audit.user_role})</span>
                </div>
              </div>
            </div>
          ))}

          {recentAudits.length === 0 && (
            <p className="text-[10px] text-gray-400 italic text-center py-6">No se han registrado modificaciones auditables en esta sesión.</p>
          )}
        </div>
      </div>
    </div>
  );
}
