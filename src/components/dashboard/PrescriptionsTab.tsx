'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, Prescription } from '@/lib/mockDb';
import { FileText, Plus, ShieldCheck } from 'lucide-react';
import PrescriptionList from '../prescriptions/PrescriptionList';
import PrescriptionForm from '../prescriptions/PrescriptionForm';
import PrescriptionPrintView from '../prescriptions/PrescriptionPrintView';
import PrescriptionVerify from '../prescriptions/PrescriptionVerify';

export default function PrescriptionsTab() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'verify'>('list');

  if (!user) return null;

  const isMother = user.role === 'mother';
  const isDoctor = user.role === 'obstetrician' || user.role === 'pediatrician';

  const userPrescriptions = db.prescriptions.filter(p => {
    if (isMother) return p.mother_id === user.id;
    return p.doctor_id === user.id;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleSuccess = () => {
    setDb(getMockDb());
    setShowCreateModal(false);
  };

  const handleSelect = (pres: Prescription) => {
    setActivePrescription(pres);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Sub tabs header */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'list' ? 'bg-pink-500 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Mis Recetas
          </button>
          <button
            onClick={() => setActiveSubTab('verify')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${activeSubTab === 'verify' ? 'bg-slate-800 text-white shadow-xs' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ShieldCheck className="h-4 w-4" /> Validar Receta
          </button>
        </div>

        {isDoctor && activeSubTab === 'list' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva Receta
          </button>
        )}
      </div>

      {activeSubTab === 'list' ? (
        <PrescriptionList
          user={user}
          prescriptions={userPrescriptions}
          onSelect={handleSelect}
          onPrint={handleSelect}
        />
      ) : (
        <PrescriptionVerify />
      )}

      {showCreateModal && (
        <PrescriptionForm
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showPrintModal && activePrescription && (
        <PrescriptionPrintView
          prescription={activePrescription}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
