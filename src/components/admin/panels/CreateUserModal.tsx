'use client';

import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import type { UserRole, ProfileStatus } from '@/types/core';

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  status: ProfileStatus;
  phone?: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateUserData) => Promise<void>;
}

export default function CreateUserModal({ isOpen, onClose, onCreate }: CreateUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('mother');
  const [status, setStatus] = useState<ProfileStatus>('approved');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({ email: email.trim(), password, full_name: fullName.trim(), role, status, phone: phone.trim() || undefined });
      setFullName(''); setEmail(''); setPassword(''); setPhone(''); setRole('mother'); setStatus('approved');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-pink-500 font-semibold text-slate-700';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-pink-500" />
              Crear Usuario Nuevo
            </h3>
            <p className="text-xs text-gray-400 mt-1">La cuenta se crea con el correo confirmado y lista para iniciar sesión.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer" title="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Nombre Completo</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Correo Electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Contraseña</label>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} required minLength={6} placeholder="Mín. 6 caracteres" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Teléfono (opcional)</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Rol</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className={inputCls}>
                <option value="mother">Madre / Paciente</option>
                <option value="obstetrician">Obstetra</option>
                <option value="pediatrician">Pediatra</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Estado Inicial</label>
              <select value={status} onChange={e => setStatus(e.target.value as ProfileStatus)} className={inputCls}>
                <option value="approved">Aprobado (acceso total)</option>
                <option value="under_review">En revisión</option>
                <option value="pending_documents">Documentos pendientes</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-2xl text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-xs rounded-xl transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-950 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
              {saving ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
