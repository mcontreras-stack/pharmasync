'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface LinkDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (code: string) => Promise<{ success: boolean; message: string }>;
}

export default function LinkDoctorModal({ isOpen, onClose, onLink }: LinkDoctorModalProps) {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await onLink(code);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setCode('');
          setSuccessMsg('');
          onClose();
        }, 2000);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('Error al conectar con la red de especialistas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Vincular con Especialista</h3>
          <p className="text-xs text-gray-400 mt-1">Ingresa el código proporcionado por tu obstetra o pediatra para habilitar su acceso clínico.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Código de Invitación</label>
            <input
              type="text"
              placeholder="Ej. OB-ANA-28 o PE-AND-04"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-center tracking-widest focus:outline-pink-500 uppercase"
              required
            />
          </div>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl text-xs text-center border border-rose-100 flex items-center gap-1.5 justify-center font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl text-xs text-center border border-emerald-100 flex items-center gap-1.5 justify-center font-bold">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              {loading ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
