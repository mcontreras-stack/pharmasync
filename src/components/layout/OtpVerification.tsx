'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';

interface OtpVerificationProps {
  userEmail: string;
  onVerify: () => void;
  onSignOut: () => void;
}

export default function OtpVerification({ userEmail, onVerify, onSignOut }: OtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>('email');

  const handleDigitChange = (val: string, index: number) => {
    if (/^[0-9]?$/.test(val)) {
      const newDigits = [...digits];
      newDigits[index] = val;
      setDigits(newDigits);
      
      if (val && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const code = digits.join('');
    if (code.length < 6) {
      setErrorMsg('Por favor ingresa los 6 dígitos.');
      return;
    }
    onVerify();
  };

  return (
    <main className="min-h-screen bg-slate-955 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-[32px] p-8 shadow-2xl space-y-6 text-left select-none">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-white">Verificación de Identidad</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hemos enviado un código OTP de 6 dígitos a <strong className="text-slate-205">{userEmail}</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              type="button"
              onClick={() => setMethod('email')}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${method === 'email' ? 'bg-slate-850 text-white' : 'text-slate-400'}`}
            >
              Verificar por Email
            </button>
            <button
              type="button"
              onClick={() => setMethod('sms')}
              className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${method === 'sms' ? 'bg-slate-850 text-white' : 'text-slate-400'}`}
            >
              Verificar por SMS
            </button>
          </div>

          <div className="flex justify-between gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl text-center font-mono text-lg font-bold focus:outline-none focus:border-pink-500 text-white"
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-500 font-bold text-center">{errorMsg}</p>
          )}

          <div className="space-y-2">
            <button
              type="submit"
              className="w-full py-3 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 transition-colors shadow-md cursor-pointer"
            >
              Confirmar Código
            </button>
            
            <button
              type="button"
              onClick={() => {
                setDigits(['1', '2', '3', '4', '5', '6']);
                setErrorMsg('');
              }}
              className="w-full py-2 bg-slate-950 text-slate-400 border border-slate-850 hover:text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer"
            >
              Autocompletar Código Demo (123456)
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onSignOut}
              className="text-[10px] text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
            >
              Volver a Iniciar Sesión / Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
