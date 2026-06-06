'use client';

import React from 'react';
import { Search, User, Check, X } from 'lucide-react';
import { getMockDb } from '@/lib/mockDb';

interface PatientProfileType {
  mother: {
    id: string;
  };
  profile?: {
    full_name: string;
  } | null;
  pregnancy?: {
    estimated_due_date?: string;
  } | null;
}

interface PendingLinkType {
  id: string;
  mother_id: string;
}

interface ObstetricianRosterProps {
  patientProfiles: PatientProfileType[];
  selectedMotherId: string;
  onSelectPatient: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  pendingLinks: PendingLinkType[];
  onLinkAction: (linkId: string, action: 'approve' | 'reject') => void;
  pregnancyWeeks: number;
}

export default function ObstetricianRoster({
  patientProfiles,
  selectedMotherId,
  onSelectPatient,
  searchQuery,
  setSearchQuery,
  pendingLinks,
  onLinkAction,
  pregnancyWeeks
}: ObstetricianRosterProps) {
  const db = getMockDb();

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4 text-left select-none">
      <h3 className="font-bold text-gray-800 flex items-center gap-2 px-2 text-sm">
        <User className="h-5 w-5 text-purple-500" />
        Mis Pacientes ({patientProfiles.length})
      </h3>

      {/* Pending linking requests */}
      {pendingLinks.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3.5 space-y-2">
          <span className="text-[9px] font-black text-amber-700 uppercase bg-amber-100/40 px-2 py-0.5 rounded-md inline-block">
            Solicitudes Pendientes ({pendingLinks.length})
          </span>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {pendingLinks.map(lnk => {
              const momProfile = db.profiles.find(p => p.id === lnk.mother_id);
              if (!momProfile) return null;
              return (
                <div key={lnk.id} className="bg-white border border-gray-150 p-2.5 rounded-xl flex items-center justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-700 truncate" title={momProfile.full_name}>{momProfile.full_name}</p>
                    <p className="text-[8px] text-gray-450 font-semibold truncate">{momProfile.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => onLinkAction(lnk.id, 'approve')}
                      className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                      title="Aceptar"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onLinkAction(lnk.id, 'reject')}
                      className="p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                      title="Rechazar"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar paciente por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-purple-500 font-semibold text-slate-800"
        />
      </div>

      {/* Roster list */}
      <div className="space-y-2 overflow-y-auto max-h-[480px]">
        {patientProfiles.length > 0 ? (
          patientProfiles.map(p => {
            const isActive = p.mother.id === selectedMotherId;
            return (
              <div
                key={p.mother.id}
                onClick={() => onSelectPatient(p.mother.id)}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  isActive 
                    ? 'bg-purple-500 text-white border-purple-500 shadow-sm font-bold' 
                    : 'bg-gray-50/50 border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate">{p.profile?.full_name}</h4>
                  <p className={`text-[9px] ${isActive ? 'text-purple-100' : 'text-gray-400'} mt-0.5 font-semibold`}>
                    FPP: {p.pregnancy?.estimated_due_date}
                  </p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  Semana {pregnancyWeeks}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-gray-400 italic text-center py-6">No se encontraron pacientes vinculados.</p>
        )}
      </div>
    </div>
  );
}
