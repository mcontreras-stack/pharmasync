'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getMockDb, MOCK_MOTHER_ID, MOCK_OBSTETRICIAN_ID, MOCK_PEDIATRICIAN_ID, MOCK_ADMIN_ID, Profile, Doctor } from '@/lib/mockDb';

export type AdminSubRole = 'superadmin' | 'admin' | 'calidad' | 'verificador_documental' | 'soporte' | 'finanzas' | 'auditor';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isMockMode: boolean;
  adminSubRole: AdminSubRole;
  setAdminSubRole: (role: AdminSubRole) => void;
  signIn: (email: string, role?: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => Promise<void>;
  signUp: (email: string, full_name: string, role: 'mother' | 'obstetrician' | 'pediatrician', phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (role: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => void;
  refreshUser: () => void;
  updateUserStatus: (status: Profile['status']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(true);
  const [adminSubRole, setAdminSubRoleState] = useState<AdminSubRole>('superadmin');

  // Load user and adminSubRole from localStorage
  useEffect(() => {
    async function loadUser() {
      try {
        const storedMockUser = localStorage.getItem('pharmasync_user');
        const storedSubRole = localStorage.getItem('pharmasync_admin_subrole') as AdminSubRole;
        if (storedSubRole) {
          setAdminSubRoleState(storedSubRole);
        }

        if (storedMockUser) {
          const parsedUser = JSON.parse(storedMockUser) as Profile;
          const db = getMockDb();
          const dbProfile = db.profiles.find(p => p.id === parsedUser.id);
          
          if (dbProfile) {
            setUser(dbProfile);
            localStorage.setItem('pharmasync_user', JSON.stringify(dbProfile));
          } else {
            setUser(parsedUser);
          }
          
          setIsMockMode(true);
          setLoading(false);
          return;
        }

        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
                status: profile.status || 'approved'
              });
              setIsMockMode(false);
            }
          }
        }
      } catch (err) {
        console.error('Error loading session:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const setAdminSubRole = (role: AdminSubRole) => {
    setAdminSubRoleState(role);
    localStorage.setItem('pharmasync_admin_subrole', role);
  };

  const signIn = async (email: string, role?: 'mother' | 'obstetrician' | 'pediatrician' | 'admin') => {
    setLoading(true);
    try {
      const db = getMockDb();
      let mockProfile = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());

      if (!mockProfile && role) {
        const newId = `user-mock-${Date.now()}`;
        mockProfile = {
          id: newId,
          email,
          full_name: email.split('@')[0],
          role,
          status: 'approved'
        };
        db.profiles.push(mockProfile);
        
        if (role === 'mother') {
          db.mothers.push({
            id: newId,
            phone: '',
            birth_date: '1995-01-01',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            blood_type: 'O+'
          });
        } else if (role === 'obstetrician' || role === 'pediatrician') {
          db.doctors.push({
            id: newId,
            license_number: `LIC-${Math.floor(Math.random() * 100000)}`,
            specialty: role,
            phone: '',
            clinic_address: '',
            consultation_hours: '',
            verification_status: 'approved',
            invite_code: `DR-${mockProfile.full_name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
          });
        }
        localStorage.setItem('pharmasync_mock_db', JSON.stringify(db));
      }

      if (mockProfile) {
        // Enforce basic status check
        if (!mockProfile.status) {
          mockProfile.status = 'approved';
        }
        setUser(mockProfile);
        localStorage.setItem('pharmasync_user', JSON.stringify(mockProfile));
        setIsMockMode(true);
      } else {
        throw new Error('Usuario no encontrado. Elige un rol para crear una cuenta demo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, full_name: string, role: 'mother' | 'obstetrician' | 'pediatrician', phone: string) => {
    setLoading(true);
    try {
      const db = getMockDb();
      const existing = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        throw new Error('Un usuario con este correo ya existe.');
      }

      const newId = `user-mock-${Date.now()}`;
      const newProfile: Profile = {
        id: newId,
        email,
        full_name,
        role,
        status: 'email_pending',
        phone
      };

      db.profiles.push(newProfile);

      if (role === 'mother') {
        db.mothers.push({
          id: newId,
          phone,
          birth_date: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          blood_type: 'O+'
        });
      } else {
        db.doctors.push({
          id: newId,
          license_number: `LIC-${Math.floor(Math.random() * 100000)}`,
          specialty: role as 'obstetrician' | 'pediatrician',
          phone,
          clinic_address: '',
          consultation_hours: '',
          verification_status: 'pending',
          invite_code: `DR-${full_name.split(' ')[0].toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
        });
      }

      localStorage.setItem('pharmasync_mock_db', JSON.stringify(db));
      setUser(newProfile);
      localStorage.setItem('pharmasync_user', JSON.stringify(newProfile));
      setIsMockMode(true);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('pharmasync_user');
      setUser(null);
      if (!isMockMode && isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
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
      localStorage.setItem('pharmasync_user', JSON.stringify(targetProfile));
      setIsMockMode(true);
    }
  };

  const refreshUser = () => {
    const storedMockUser = localStorage.getItem('pharmasync_user');
    if (storedMockUser) {
      setUser(JSON.parse(storedMockUser));
    }
  };

  const updateUserStatus = (status: Profile['status']) => {
    if (!user) return;
    const updated = { ...user, status };
    setUser(updated);
    localStorage.setItem('pharmasync_user', JSON.stringify(updated));

    // Update in mockDb as well
    const db = getMockDb();
    db.profiles = db.profiles.map(p => p.id === user.id ? { ...p, status } : p);
    
    // Also if doctor, update verification_status accordingly
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

    localStorage.setItem('pharmasync_mock_db', JSON.stringify(db));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isMockMode, 
      adminSubRole, 
      setAdminSubRole, 
      signIn, 
      signUp, 
      signOut, 
      switchRole, 
      refreshUser,
      updateUserStatus
    }}>
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
