'use client';

import React, { useState } from 'react';

interface BirthRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (name: string, date: string, gender: string, weight?: number, height?: number) => void;
}

export default function BirthRegisterModal({ isOpen, onClose, onRegister }: BirthRegisterModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [gender, setGender] = useState('Masculino');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    onRegister(
      name,
      date,
      gender,
      weight ? parseInt(weight, 10) : undefined,
      height ? parseFloat(height) : undefined
    );
    
    setName('');
    setDate('');
    setGender('Masculino');
    setWeight('');
    setHeight('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-gray-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Registrar Nacimiento</h3>
          <p className="text-xs text-gray-400 mt-1">Ingrese los datos clínicos del recién nacido. Esto graduará su embarazo y abrirá la ficha neonatal.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1 font-semibold">Nombre Completo del Bebé</label>
            <input
              type="text"
              placeholder="Ej. Mateo López"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Fecha de Nacimiento</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Género</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Peso de Egreso (gramos)</label>
              <input
                type="number"
                placeholder="Ej. 3250"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-semibold">Talla / Estatura (cm)</label>
              <input
                type="number"
                step="0.5"
                placeholder="Ej. 50"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-pink-500 font-bold"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Registrar Nacimiento 🎉
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
