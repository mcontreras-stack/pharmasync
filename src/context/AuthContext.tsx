'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { hasAdmins } from '@/services/adminService';
import { getMockDb, saveMockDb, MOCK_MOTHER_ID, MOCK_OBSTETRICIAN_ID, MOCK_PEDIATRICIAN_ID, MOCK_ADMIN_ID, Profile, Doctor } from '@/lib/mockDb';
import { emailService } from '@/services/emailService';

export type AdminSubRole = 'superadmin' | 'admin' | 'calidad' | 'verificador_documental' | 'soporte' | 'finanzas' | 'auditor';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isMockMode: boolean;
  adminSubRole: AdminSubRole;
  setAdminSubRole: (role: AdminSubRole) => void;
  signIn: (email: string, password?: string, role?: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => Promise<void>;
  signUp: (email: string, password?: string, full_name?: string, role?: 'mother' | 'obstetrician' | 'pediatrician', phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => void;
  refreshUser: () => void;
  updateUserStatus: (status: Profile['status']) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(true);
  const [adminSubRole, setAdminSubRoleState] = useState<AdminSubRole>('superadmin');
  
  // Usar hooks de next/navigation para compatibilidad con App Router
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      try {
        // Evitar ejecución durante el build estático si no hay window
        if (typeof window === 'undefined') return;

        // Verificar si hay admins en el sistema
        const adminsExist = await hasAdmins();

        // Si no hay admins y no estamos en /setup, redirigir a setup
        if (!adminsExist && pathname !== '/setup' && isSupabaseConfigured()) {
          router.push('/setup');
          setLoading(false);
          return;
        }

        const storedMockUser = localStorage.getItem('vitarahealth_user');
        const storedSubRole = localStorage.getItem('vitarahealth_admin_subrole') as AdminSubRole;
        if (storedSubRole) setAdminSubRoleState(storedSubRole);

        if (storedMockUser) {
          const parsedUser = JSON.parse(storedMockUser) as Profile;
          // Check if stored user was mock
          if (parsedUser.email.toLowerCase().endsWith('@vitarahealth.com') || !isSupabaseConfigured()) {
            const db = getMockDb();
            const dbProfile = db.profiles.find(p => p.id === parsedUser.id);
            const activeUser = dbProfile || parsedUser;
            setUser(activeUser);
            setIsMockMode(true);

            if (activeUser.email.toLowerCase() === 'admin@alvisautomate.com' || activeUser.email.toLowerCase() === 'admin@vitarahealth.com') {
              setAdminSubRoleState('superadmin');
              localStorage.setItem('vitarahealth_admin_subrole', 'superadmin');
            }

            setLoading(false);
            return;
          }
        }

        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
              const u: Profile = { id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role, status: profile.status || 'approved' };
              setUser(u);
              localStorage.setItem('vitarahealth_user', JSON.stringify(u));
              setIsMockMode(false);

              if (u.email.toLowerCase() === 'admin@alvisautomate.com' || u.email.toLowerCase() === 'admin@vitarahealth.com') {
                setAdminSubRoleState('superadmin');
                localStorage.setItem('vitarahealth_admin_subrole', 'superadmin');
              }

              // Redirección automática según el rol
              redirectByRole(u.role);
            } else {
              // Fallback
              const meta = session.user.user_metadata || {};
              const dProf: Profile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: meta.full_name || session.user.email?.split('@')[0] || 'Usuario Real',
                role: meta.role || 'mother',
                status: 'approved'
              };
              await supabase.from('profiles').upsert(dProf);
              setUser(dProf);
              localStorage.setItem('vitarahealth_user', JSON.stringify(dProf));
              setIsMockMode(false);

              if (dProf.email.toLowerCase() === 'admin@alvisautomate.com' || dProf.email.toLowerCase() === 'admin@vitarahealth.com') {
                setAdminSubRoleState('superadmin');
                localStorage.setItem('vitarahealth_admin_subrole', 'superadmin');
              }

              // Redirección automática según el rol
              redirectByRole(dProf.role);
            }
          }
        }
      } catch (err) {
        console.error('Error loading session:', err);
      } finally {
        setLoading(false);
      }
    }

    const redirectByRole = (role: string) => {
      if (pathname === '/setup' || pathname === '/login' || pathname === '/') return;

      switch (role) {
        case 'admin':
          if (pathname && !pathname.startsWith('/admin')) {
            router.push('/admin');
          }
          break;
        case 'mother':
          if (pathname && !pathname.startsWith('/dashboard')) {
            router.push('/dashboard');
          }
          break;
        case 'obstetrician':
        case 'pediatrician':
          if (pathname && !pathname.startsWith('/professional')) {
            router.push('/professional');
          }
          break;
        default:
          break;
      }
    };

    loadUser();
  }, [router, pathname]);

  const setAdminSubRole = (role: AdminSubRole) => {
    setAdminSubRoleState(role);
    localStorage.setItem('vitarahealth_admin_subrole', role);
  };

  const signIn = async (email: string, password?: string, role?: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => {
    setLoading(true);
    try {
      const isDemo = email.toLowerCase().endsWith('@vitarahealth.com');
      
      if (isSupabaseConfigured() && password && !isDemo) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (!profile) {
            profile = { id: data.user.id, email, full_name: email.split('@')[0], role: role || 'mother', status: 'approved' };
            await supabase.from('profiles').upsert(profile);
          }
          const loggedIn: Profile = { id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role, status: profile.status || 'approved' };
          setUser(loggedIn);
          localStorage.setItem('vitarahealth_user', JSON.stringify(loggedIn));
          setIsMockMode(false);
          
          if (email.toLowerCase() === 'admin@alvisautomate.com' || email.toLowerCase() === 'admin@vitarahealth.com') {
            setAdminSubRoleState('superadmin');
            localStorage.setItem('vitarahealth_admin_subrole', 'superadmin');
          }
          return;
        }
      }

      // Mock Mode
      const db = getMockDb();
      let mockProfile = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

      if (!mockProfile && role) {
        const newId = `user-mock-${Date.now()}`;
        mockProfile = { id: newId, email, full_name: email.split('@')[0], role, status: 'approved', password: password || '123456' };
        db.profiles.push(mockProfile);
        
        if (role === 'mother') {
          db.mothers.push({ id: newId, phone: '', birth_date: '1995-01-01', emergency_contact_name: '', emergency_contact_phone: '', blood_type: 'O+' });
        } else {
          db.doctors.push({
            id: newId,
            license_number: `LIC-${Math.floor(Math.random() * 100000)}`,
            specialty: role as 'obstetrician' | 'pediatrician',
            phone: '', clinic_address: '', consultation_hours: '', verification_status: 'approved',
            invite_code: `DR-${mockProfile.full_name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
          });
        }
        saveMockDb(db);
      }

      if (mockProfile) {
        if (password && mockProfile.password && mockProfile.password !== password) {
          throw new Error('Contraseña incorrecta en credenciales de demostración.');
        }
        if (!mockProfile.status) mockProfile.status = 'approved';
        setUser(mockProfile);
        localStorage.setItem('vitarahealth_user', JSON.stringify(mockProfile));
        setIsMockMode(true);
        
        if (email.toLowerCase() === 'admin@alvisautomate.com' || email.toLowerCase() === 'admin@vitarahealth.com') {
          setAdminSubRoleState('superadmin');
          localStorage.setItem('vitarahealth_admin_subrole', 'superadmin');
        }
      } else {
        throw new Error('Usuario no encontrado. Elige un rol para crear una cuenta demo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password?: string, full_name?: string, role?: 'mother' | 'obstetrician' | 'pediatrician', phone?: string) => {
    setLoading(true);
    try {
      const isDemo = email.toLowerCase().endsWith('@vitarahealth.com');

      if (isSupabaseConfigured() && password && full_name && role && phone && !isDemo) {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name, role, phone } }
        });
        if (error) throw error;
        if (data.user) {
          const newProfile: Profile = { id: data.user.id, email, full_name, role, status: 'email_pending', phone };
          await supabase.from('profiles').upsert(newProfile);
          
          setUser(newProfile);
          localStorage.setItem('vitarahealth_user', JSON.stringify(newProfile));
          setIsMockMode(false);
          return;
        }
      }

      // Mock Mode
      const db = getMockDb();
      const existing = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (existing) throw new Error('Un usuario con este correo ya existe.');

      const newId = `user-mock-${Date.now()}`;
      const newProfile: Profile = {
        id: newId, email, full_name: full_name || email.split('@')[0], role: role || 'mother',
        status: 'email_pending', phone, password: password || '123456'
      };

      db.profiles.push(newProfile);

      if (role === 'mother') {
        db.mothers.push({ id: newId, phone: phone || '', birth_date: '', emergency_contact_name: '', emergency_contact_phone: '', blood_type: 'O+' });
      } else {
        db.doctors.push({
          id: newId, license_number: `LIC-${Math.floor(Math.random() * 100000)}`, specialty: (role || 'obstetrician') as 'obstetrician' | 'pediatrician',
          phone: phone || '', clinic_address: '', consultation_hours: '', verification_status: 'pending',
          invite_code: `DR-${(full_name || 'DOC').split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
        });
      }

      saveMockDb(db);
      
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`vitarahealth_otp_${email.toLowerCase()}`, mockOtp);
      emailService.sendEmail(
        email,
        'Verificación de Cuenta - Código OTP 🔑',
        `<h3>Bienvenido a Vitara Health</h3>
         <p>Hola <strong>${full_name || email}</strong>,</p>
         <p>Tu código de seguridad para verificar tu cuenta es:</p>
         <div style="background:#f1f5f9; padding:15px; text-align:center; font-size:24px; font-weight:bold; letter-spacing:4px; border-radius:10px; margin: 15px 0; color:#1e293b;">
           ${mockOtp}
         </div>`
      );

      setUser(newProfile);
      localStorage.setItem('vitarahealth_user', JSON.stringify(newProfile));
      setIsMockMode(true);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('vitarahealth_user');
      setUser(null);
      if (!isMockMode && isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    const isDemo = email.toLowerCase().endsWith('@vitarahealth.com');

    if (isSupabaseConfigured() && !isDemo) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      if (error) throw error;
      return;
    }

    // Mock Mode
    const db = getMockDb();
    const profile = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) throw new Error('No existe una cuenta registrada con este correo electrónico.');

    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(`vitarahealth_reset_${email.toLowerCase()}`, mockCode);

    const resetLink = `/reset-password?email=${encodeURIComponent(email)}&code=${mockCode}`;
    emailService.sendEmail(
      email,
      'Restablecer Contraseña 🔄',
      `<h3>Recuperación de Credenciales</h3>
       <p>Código temporal: <strong>${mockCode}</strong></p>
       <p><a href="${resetLink}">Restablecer mi Contraseña</a></p>`,
      resetLink
    );
  };

  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    const isDemo = email.toLowerCase().endsWith('@vitarahealth.com');

    if (isSupabaseConfigured() && !isDemo) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return;
    }

    // Mock Mode
    const savedCode = localStorage.getItem(`vitarahealth_reset_${email.toLowerCase()}`);
    if (!savedCode || savedCode !== code) throw new Error('El código ingresado es inválido.');

    const db = getMockDb();
    db.profiles = db.profiles.map(p => p.email.toLowerCase() === email.toLowerCase() ? { ...p, password: newPassword } : p);
    saveMockDb(db);

    localStorage.removeItem(`vitarahealth_reset_${email.toLowerCase()}`);
  };

  const switchRole = (role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => {
    let mockId = MOCK_MOTHER_ID;
    if (role === 'obstetrician') mockId = MOCK_OBSTETRICIAN_ID;
    if (role === 'pediatrician') mockId = MOCK_PEDIATRICIAN_ID;
    if (role === 'admin') mockId = MOCK_ADMIN_ID;

    const db = getMockDb();
    const targetProfile = db.profiles.find(p => p.id === mockId) || db.profiles.find(p => p.role === role);

    if (targetProfile) {
      setUser(targetProfile);
      localStorage.setItem('vitarahealth_user', JSON.stringify(targetProfile));
      setIsMockMode(true);
    }
  };

  const refreshUser = () => {
    if (!isMockMode && isSupabaseConfigured() && user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          const updated = { id: data.id, email: data.email, full_name: data.full_name, role: data.role, status: data.status || 'approved' };
          setUser(updated);
          localStorage.setItem('vitarahealth_user', JSON.stringify(updated));
        }
      });
      return;
    }
    const storedMockUser = localStorage.getItem('vitarahealth_user');
    if (storedMockUser) setUser(JSON.parse(storedMockUser));
  };

  const updateUserStatus = (status: Profile['status']) => {
    if (!user) return;
    const updated = { ...user, status };
    setUser(updated);
    localStorage.setItem('vitarahealth_user', JSON.stringify(updated));

    if (!isMockMode && isSupabaseConfigured()) {
      supabase.from('profiles').update({ status }).eq('id', user.id).then(({ error }) => {
        if (error) console.error('Error updating status in Supabase:', error);
      });
    }

    const db = getMockDb();
    db.profiles = db.profiles.map(p => p.id === user.id ? { ...p, status } : p);
    
    if (user.role === 'obstetrician' || user.role === 'pediatrician') {
      db.doctors = db.doctors.map(d => {
        if (d.id === user.id) {
          let verification_status: Doctor['verification_status'] = 'pending';
          if (status === 'approved') verification_status = 'approved';
          if (status === 'rejected') verification_status = 'rejected';
          return { ...d, verification_status };
        }
        return d;
      });
    }
    saveMockDb(db);
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, isMockMode, adminSubRole, setAdminSubRole, 
      signIn, signUp, signOut, switchRole, refreshUser, updateUserStatus,
      requestPasswordReset, confirmPasswordReset
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
