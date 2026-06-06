'use client';

import { useEffect } from 'react';

export default function DemoPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vitarahealth_force_mock_mode', 'true');
      localStorage.removeItem('vitarahealth_user'); // Clear active user to avoid mixing up
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent"></div>
      <p className="text-xs text-slate-400 font-semibold mt-4">Activando Modo Demo...</p>
    </div>
  );
}
