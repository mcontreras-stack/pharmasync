'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type AdminSubRole = 'superadmin' | 'admin' | 'calidad' | 'verificador_documental' | 'soporte' | 'finanzas' | 'auditor';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin';
  status: string;
  avatar_url?: string;
  phone?: string;
  national_id?: string;
  nationality?: string;
  country?: string;
  city?: string;
  birth_date?: string;
}

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  adminSubRole: AdminSubRole;
  setAdminSubRole: (role: AdminSubRole) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, full_name: string, role: 'mother' | 'obstetrician' | 'pediatrician', phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserStatus: (status: Profile['status']) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSubRole, setAdminSubRoleState] = useState<AdminSubRole>('superadmin');

  // Cargar usuario al montar el componente
  useEffect(() => {
    async function loadUser() {
      try {
        if (!isSupabaseConfigured()) {
          console.error('Supabase no está configurado. Verifica las variables de entorno.');
          setLoading(false);
          return;
        }

        // Obtener la sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Obtener el perfil del usuario desde la tabla profiles
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found, es esperado para usuarios nuevos
            throw error;
          }

          if (profile) {
            const userProfile: Profile = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              status: profile.status || 'approved',
              avatar_url: profile.avatar_url,
              phone: profile.phone,
              national_id: profile.national_id,
              nationality: profile.nationality,
              country: profile.country,
              city: profile.city,
              birth_date: profile.birth_date,
            };
            setUser(userProfile);
            localStorage.setItem('vitarahealth_user', JSON.stringify(userProfile));
          } else {
            // Si el perfil no existe, crear uno automáticamente
            const newProfile: Profile = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
              role: session.user.user_metadata?.role || 'mother',
              status: 'pending_documents',
              avatar_url: session.user.user_metadata?.avatar_url,
            };

            const { error: insertError } = await supabase
              .from('profiles')
              .insert([newProfile]);

            if (insertError) throw insertError;

            setUser(newProfile);
            localStorage.setItem('vitarahealth_user', JSON.stringify(newProfile));
          }
        }
      } catch (err) {
        console.error('Error loading user session:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const setAdminSubRole = (role: AdminSubRole) => {
    setAdminSubRoleState(role);
    localStorage.setItem('vitarahealth_admin_subrole', role);
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;

      if (data.user) {
        // Obtener o crear perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profile) {
          const userProfile: Profile = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            status: profile.status || 'approved',
            avatar_url: profile.avatar_url,
            phone: profile.phone,
            national_id: profile.national_id,
            nationality: profile.nationality,
            country: profile.country,
            city: profile.city,
            birth_date: profile.birth_date,
          };
          setUser(userProfile);
          localStorage.setItem('vitarahealth_user', JSON.stringify(userProfile));
        } else {
          // Crear perfil automáticamente
          const newProfile: Profile = {
            id: data.user.id,
            email: data.user.email || '',
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: data.user.user_metadata?.role || 'mother',
            status: 'pending_documents',
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);

          if (insertError) throw insertError;

          setUser(newProfile);
          localStorage.setItem('vitarahealth_user', JSON.stringify(newProfile));
        }
      }
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    full_name: string,
    role: 'mother' | 'obstetrician' | 'pediatrician',
    phone?: string
  ) => {
    setLoading(true);
    try {
      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role,
            phone,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // El trigger on_auth_user_created debería crear el perfil automáticamente
        // Pero si no, lo creamos manualmente
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (!existingProfile) {
          const newProfile: Profile = {
            id: data.user.id,
            email,
            full_name,
            role,
            status: 'pending_documents',
            phone,
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);

          if (insertError) throw insertError;
        }

        // Crear entrada en la tabla correspondiente según el rol
        if (role === 'mother') {
          const { error: motherError } = await supabase
            .from('mothers')
            .insert([{ id: data.user.id, phone: phone || '' }]);

          if (motherError && motherError.code !== '23505') {
            // 23505 = unique violation, es ok si ya existe
            throw motherError;
          }
        } else {
          // Para profesionales, crear entrada en professionals
          const { error: profError } = await supabase
            .from('professionals')
            .insert([{
              id: data.user.id,
              specialty: role,
              exequatur: `TEMP-${Date.now()}`, // Temporal, debe ser actualizado por el usuario
            }]);

          if (profError && profError.code !== '23505') {
            throw profError;
          }
        }

        const newProfile: Profile = {
          id: data.user.id,
          email,
          full_name,
          role,
          status: 'pending_documents',
          phone,
        };

        setUser(newProfile);
        localStorage.setItem('vitarahealth_user', JSON.stringify(newProfile));
      }
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      localStorage.removeItem('vitarahealth_user');
      localStorage.removeItem('vitarahealth_admin_subrole');
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const userProfile: Profile = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            status: profile.status || 'approved',
            avatar_url: profile.avatar_url,
            phone: profile.phone,
            national_id: profile.national_id,
            nationality: profile.nationality,
            country: profile.country,
            city: profile.city,
            birth_date: profile.birth_date,
          };
          setUser(userProfile);
          localStorage.setItem('vitarahealth_user', JSON.stringify(userProfile));
        }
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  const updateUserStatus = async (status: Profile['status']) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, status };
      setUser(updatedUser);
      localStorage.setItem('vitarahealth_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Update user status error:', err);
      throw err;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Password reset request error:', err);
      throw err;
    }
  };

  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });

      if (error) throw error;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Password reset confirmation error:', err);
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    adminSubRole,
    setAdminSubRole,
    signIn,
    signUp,
    signOut,
    refreshUser,
    updateUserStatus,
    requestPasswordReset,
    confirmPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
