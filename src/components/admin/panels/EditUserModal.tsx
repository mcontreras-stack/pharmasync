'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/types/database';
import { Edit2, X } from 'lucide-react';

interface EditUserModalProps {
  profile: Profile | null;
  onClose: () => void;
  onSave: (name: string, email: string) => void;
}

export default function EditUserModal({ profile, onClose, onSave }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (profile) {
      setTimeout(() => {
        setName(profile.full_name);
        setEmail(profile.email);
      }, 0);
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, email);
  };

  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-[32px] border border-gray-100 w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <Edit2 className="h-4 w-4 text-slate-700" />
          Editar Perfil de Usuario
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Modifica los datos del expediente general de la cuenta</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              required
            />
          </div>

          <div>
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
              required
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
