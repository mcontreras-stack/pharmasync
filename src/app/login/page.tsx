'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent"></div>
      <p className="text-xs text-slate-400 font-semibold mt-4">Redirigiendo...</p>
    </div>
  );
}
