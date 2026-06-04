'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Cpu,
  Database,
  Wifi,
  Mail,
  MessageSquare
} from 'lucide-react';

export default function SystemMonitoring() {
  // Live fluctuating load states for high-fidelity simulation
  const [cpuLoad, setCpuLoad] = useState(24);
  const [ramLoad, setRamLoad] = useState(62);
  const [dbLoad, setDbLoad] = useState(15);
  const [latency, setLatency] = useState(48);

  useEffect(() => {
    // Tick to change values slightly simulating real-time diagnostics
    const interval = setInterval(() => {
      setCpuLoad(prev => Math.max(10, Math.min(90, prev + Math.floor(Math.random() * 9) - 4)));
      setDbLoad(prev => Math.max(5, Math.min(80, prev + Math.floor(Math.random() * 5) - 2)));
      setLatency(prev => Math.max(30, Math.min(90, prev + Math.floor(Math.random() * 11) - 5)));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const systems = [
    { name: 'Base de Datos (Supabase)', status: 'online', type: 'Database', latency: '12ms', icon: Database },
    { name: 'API REST Gateway', status: 'online', type: 'API', latency: '24ms', icon: Wifi },
    { name: 'Storage Médico (S3 Bucket)', status: 'online', type: 'Storage', latency: '42ms', icon: HardDrive },
    { name: 'Mailer SMTP Server (SendGrid)', status: 'online', type: 'Email', latency: '150ms', icon: Mail },
    { name: 'WhatsApp Twilio Webhook', status: 'online', type: 'WhatsApp', latency: '98ms', icon: MessageSquare }
  ];

  // Render SVG circular loading dial
  const renderDialGauge = (percentage: number, label: string, color: string) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col items-center justify-center space-y-3">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">{label}</span>
        <div className="relative h-24 w-24 flex items-center justify-center">
          <svg className="h-full w-full transform -rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-sm font-black text-slate-800">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. LIVE TELEMETRY GAUGES DIALS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {renderDialGauge(cpuLoad, 'Uso de CPU', '#6366f1')}
        {renderDialGauge(ramLoad, 'Memoria RAM', '#a855f7')}
        {renderDialGauge(dbLoad, 'Carga de Supabase', '#10b981')}
        
        {/* Latency card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Latencia de Red (API)</span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 font-mono">{latency}</span>
            <span className="text-xs text-gray-450 font-bold">ms</span>
          </div>
          <span className="text-[8px] text-emerald-500 font-bold mt-1 block">● Óptimo (Menor a 100ms)</span>
        </div>
      </div>

      {/* 2. INFRASTRUCTURE SYSTEMS STATUS */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <FileBarChart2 className="h-5 w-5 text-slate-700 shrink-0" />
          Estado de Dependencias del Servidor & Pings
        </h3>
        <p className="text-[10px] text-gray-400">Verifica la conectividad de los microservicios externos y del almacén HIPAA</p>

        <div className="space-y-3">
          {systems.map((sys, idx) => {
            const Icon = sys.icon;
            return (
              <div key={idx} className="p-4 bg-slate-50 border border-gray-100 rounded-2xl flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white border border-gray-150 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5 text-slate-600" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 block">{sys.name}</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5 font-semibold uppercase">{sys.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500">
                  <span>Ping: {sys.latency}</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    En línea
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
