'use client';

import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onReset: (newPassword: string) => Promise<void>;
}

export default function ResetPasswordModal({ isOpen, userName, onClose, onReset }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onReset(password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo resetear la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Resetear Contraseña
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Define una contraseña nueva para <strong className="text-slate-700">{userName}</strong>. Compártela con el usuario de forma segura.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer" title="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Contraseña Nueva</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
                placeholder="Mín. 6 caracteres"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-pink-500 font-semibold text-slate-700"
              />
              <button
                type="button"
                onClick={generate}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black transition-colors cursor-pointer"
              >
                Generar
              </button>
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
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer">
              {saving ? 'Guardando...' : 'Resetear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
