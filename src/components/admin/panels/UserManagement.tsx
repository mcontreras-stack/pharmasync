'use client';

import React, { useState, useEffect } from 'react';
import { getMockDb, saveMockDb, Profile } from '@/lib/mockDb';
import { Search, UserCheck, UserX, Trash2, Edit2, FileText, UserCheck2, Eye, X, History, AlertCircle, Check } from 'lucide-react';
import EditUserModal from './EditUserModal';
import UserLogsDrawer from './UserLogsDrawer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { getAllUsers, suspendUser, reactivateUser } from '@/services/adminService';

export default function UserManagement() {
  const { isMockMode } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'mother' | 'obstetrician' | 'pediatrician' | 'admin'>('all');
  
  // Drawer & Modal States
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [activeLogUser, setActiveLogUser] = useState<Profile | null>(null);

  const loadData = React.useCallback(async () => {
    if (isMockMode) {
      setDb(getMockDb());
      setLoadError(null);
    } else {
      try {
        setLoading(true);
        setLoadError(null);
        const usersList = await getAllUsers();
        const mappedProfiles = usersList.map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          status: u.status as Profile['status'],
          avatar_url: u.avatar_url,
          is_suspended: u.status === 'suspended'
        }));
        
        setDb(prev => ({
          ...prev,
          profiles: mappedProfiles,
          audit_logs: []
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido al cargar usuarios';
        console.error('[UserManagement] loadData error:', err);
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    }
  }, [isMockMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filters
  const filteredProfiles = db.profiles.filter(p => {
    const matchesSearch = 
      (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || p.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Action: Suspend / Reactivate
  const toggleSuspension = async (userId: string) => {
    const target = db.profiles.find(p => p.id === userId);
    if (!target) return;

    const nextSuspended = !target.is_suspended;

    if (isMockMode) {
      const updatedProfiles: Profile[] = db.profiles.map(p => {
        if (p.id !== userId) return p;
        const newLog = {
          id: `log-${Date.now()}`, user_id: 'admin-juan-000', user_email: 'admin@vitarahealth.com', user_role: 'admin',
          action: nextSuspended ? 'suspend_user' : 'reactivate_user', table_affected: 'profiles', record_id: userId,
          event: `${nextSuspended ? 'Cuenta Suspendida' : 'Cuenta Reactivada'} para usuario ${p.email}`,
          ip_address: '190.16.200.45', user_agent: 'Chrome/124.0.0.0 (Windows 11)', created_at: new Date().toISOString(), is_suspicious: false
        };
        db.audit_logs = [newLog, ...db.audit_logs];
        return { ...p, is_suspended: nextSuspended };
      });
      const updatedDb = { ...db, profiles: updatedProfiles };
      setDb(updatedDb); saveMockDb(updatedDb);
    } else {
      try {
        setLoading(true);
        if (nextSuspended) {
          await suspendUser(userId, 'Suspendido por administrador');
        } else {
          await reactivateUser(userId);
        }
        await loadData();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al cambiar estado de suspensión');
      } finally {
        setLoading(false);
      }
    }
  };

  // Action: Delete Account
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta cuenta? Esta acción no se puede deshacer.')) return;

    if (isMockMode) {
      const targetProfile = db.profiles.find(p => p.id === userId);
      const updatedProfiles: Profile[] = db.profiles.filter(p => p.id !== userId);
      const updatedMothers = db.mothers.filter(m => m.id !== userId);
      const updatedDoctors = db.doctors.filter(d => d.id !== userId);

      const newLog = {
        id: `log-${Date.now()}`,
        user_id: 'admin-juan-000',
        user_email: 'admin@vitarahealth.com',
        user_role: 'admin',
        action: 'delete_user',
        table_affected: 'profiles',
        record_id: userId,
        event: `Cuenta eliminada permanentemente: ${targetProfile?.email}`,
        ip_address: '190.16.200.45',
        user_agent: 'Chrome/124.0.0.0 (Windows 11)',
        created_at: new Date().toISOString(),
        is_suspicious: false
      };

      const updatedDb = {
        ...db,
        profiles: updatedProfiles,
        mothers: updatedMothers,
        doctors: updatedDoctors,
        audit_logs: [newLog, ...db.audit_logs]
      };
      
      setDb(updatedDb);
      saveMockDb(updatedDb);
    } else {
      try {
        setLoading(true);
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        await loadData();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar usuario');
      } finally {
        setLoading(false);
      }
    }
  };

  // Action: Save Edit profile detail
  const handleSaveProfile = async (name: string, email: string) => {
    if (!editingProfile) return;

    if (isMockMode) {
      const updatedProfiles: Profile[] = db.profiles.map(p => {
        if (p.id === editingProfile.id) {
          return { ...p, full_name: name, email: email };
        }
        return p;
      });

      const updatedDb = { ...db, profiles: updatedProfiles };
      setDb(updatedDb);
      saveMockDb(updatedDb);
      setEditingProfile(null);
    } else {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: name, email: email })
          .eq('id', editingProfile.id);
        if (error) throw error;
        await loadData();
        setEditingProfile(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al editar perfil');
      } finally {
        setLoading(false);
      }
    }
  };

  // Action: Approve general user onboarding registration
  const handleApproveUser = async (userId: string) => {
    if (isMockMode) {
      const updatedProfiles: Profile[] = db.profiles.map(p => {
        if (p.id === userId) {
          return { ...p, status: 'approved' };
        }
        return p;
      });
      const updatedDb = { ...db, profiles: updatedProfiles };
      setDb(updatedDb);
      saveMockDb(updatedDb);
    } else {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'approved' })
          .eq('id', userId);
        if (error) throw error;
        await loadData();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al aprobar usuario');
      } finally {
        setLoading(false);
      }
    }
  };

  // Action: Impersonation Trigger
  const handleImpersonate = (targetUser: Profile) => {
    if (typeof window === 'undefined') return;
    
    // Save current admin user so we can return back
    const currentAdmin = localStorage.getItem('vitarahealth_user');
    if (currentAdmin) {
      localStorage.setItem('vitarahealth_admin_impersonator', currentAdmin);
    }
    
    // Set active session user to target profile
    localStorage.setItem('vitarahealth_user', JSON.stringify(targetUser));
    
    // Reload page to switch route view scopes immediately
    window.location.reload();
  };

  // Filter logs for selected user
  const selectedUserLogs = activeLogUser 
    ? db.audit_logs.filter(l => l.user_id === activeLogUser.id || l.email === activeLogUser.email)
    : [];

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
      {/* Search and filter headers */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h3 className="font-black text-slate-800 text-sm">Listado de Usuarios Registrados</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Controla perfiles, edita credenciales y suspende accesos</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-150 rounded-xl text-xs bg-slate-50 focus:outline-none focus:bg-white focus:border-slate-400 w-64 font-medium"
            />
          </div>

          {/* Role selection tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
            {(['all', 'mother', 'obstetrician', 'pediatrician', 'admin'] as const).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-2.5 py-1.5 rounded-lg capitalize transition-all duration-150 ${selectedRole === role ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {role === 'all' ? 'Todos' : role === 'mother' ? 'Madres' : role === 'obstetrician' ? 'Obstetras' : role === 'pediatrician' ? 'Pediatras' : 'Admins'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {loadError && !isMockMode && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 items-start">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-700">Error al cargar usuarios desde Supabase</p>
            <p className="text-[10px] text-rose-600 mt-0.5">{loadError}</p>
            <p className="text-[10px] text-rose-500 mt-1">
              Posibles causas: (1) Falta política RLS en la tabla <code className="bg-rose-100 px-1 rounded">profiles</code> que permita al rol <code className="bg-rose-100 px-1 rounded">service_role</code> o <code className="bg-rose-100 px-1 rounded">authenticated</code> leer.
              (2) La tabla <code className="bg-rose-100 px-1 rounded">profiles</code> no existe en Supabase.
              Revisa la consola del navegador (F12) para más detalles.
            </p>
            <button onClick={loadData} className="mt-2 text-[10px] font-bold text-rose-600 underline hover:text-rose-800">Reintentar</button>
          </div>
        </div>
      )}

      {/* Empty state with hint when in production */}
      {!isMockMode && !loading && !loadError && db.profiles.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700">La tabla profiles está vacía en Supabase</p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              La consulta a Supabase retornó 0 registros. Verifica:
            </p>
            <ul className="text-[10px] text-amber-600 mt-1 list-disc ml-3 space-y-0.5">
              <li>Que la tabla <code className="bg-amber-100 px-1 rounded">profiles</code> tiene filas (verifica en Supabase Studio)</li>
              <li>Que las políticas RLS (Row Level Security) permiten <code className="bg-amber-100 px-1 rounded">SELECT</code> para el rol del admin</li>
              <li>Revisa la consola del navegador (F12) para ver el log de <code className="bg-amber-100 px-1 rounded">[adminService]</code></li>
            </ul>
          </div>
        </div>
      )}

      {/* Users roster table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Rol de Cuenta</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-center">Acciones y Auditoría</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400 font-medium">
                  No se encontraron usuarios coincidentes.
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile) => {
                let roleColor = 'bg-pink-100 text-pink-700';
                let roleLabel = 'Madre';
                if (profile.role === 'obstetrician') {
                  roleColor = 'bg-purple-100 text-purple-700';
                  roleLabel = 'Obstetra';
                } else if (profile.role === 'pediatrician') {
                  roleColor = 'bg-emerald-100 text-emerald-700';
                  roleLabel = 'Pediatra';
                } else if (profile.role === 'admin') {
                  roleColor = 'bg-slate-800 text-white';
                  roleLabel = 'Admin';
                }

                return (
                  <tr key={profile.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* User Profile */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200 uppercase shrink-0">
                        {profile.full_name.substring(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-gray-700 block">{profile.full_name}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{profile.email} • ID: {profile.id}</span>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3 px-4">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${roleColor}`}>
                        {roleLabel}
                      </span>
                    </td>

                    {/* Account status */}
                    <td className="py-3 px-4">
                      {profile.is_suspended ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-rose-100 text-rose-700">
                          Suspendido
                        </span>
                      ) : profile.status === 'under_review' ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-amber-100 text-amber-700 animate-pulse">
                          En Revisión
                        </span>
                      ) : profile.status === 'pending_documents' ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-yellow-100 text-yellow-700">
                          Doc. Pendientes
                        </span>
                      ) : profile.status === 'email_pending' ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-gray-100 text-gray-500">
                          Email Pendiente
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-emerald-100 text-emerald-700">
                          Activo
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Impersonate */}
                        {profile.role !== 'admin' && (
                          <button
                            onClick={() => handleImpersonate(profile)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[10px] font-bold shadow-xs transition-colors"
                            title="Entrar temporalmente en la cuenta de este usuario"
                          >
                            <Eye className="h-3 w-3" />
                            Impersonar
                          </button>
                        )}

                        {/* Approve button (if pending) */}
                        {profile.role !== 'admin' && (profile.status === 'under_review' || profile.status === 'pending_documents' || profile.status === 'email_pending') && (
                          <button
                            onClick={() => handleApproveUser(profile.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-750 text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                            title="Aprobar registro y documentos del usuario"
                          >
                            <Check className="h-3 w-3" />
                            Aprobar
                          </button>
                        )}

                        {/* Edit details */}
                        <button
                          onClick={() => setEditingProfile(profile)}
                          className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-slate-250 hover:text-slate-800 transition-colors"
                          title="Editar detalles"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Logs activity */}
                        <button
                          onClick={() => setActiveLogUser(profile)}
                          className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors"
                          title="Ver bitácora de actividad"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>

                        {/* Suspend / Activate toggle */}
                        {profile.role !== 'admin' && (
                          <button
                            onClick={() => toggleSuspension(profile.id)}
                            className={`p-1.5 rounded-lg transition-colors ${profile.is_suspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                            title={profile.is_suspended ? 'Reactivar acceso' : 'Suspender acceso temporalmente'}
                          >
                            {profile.is_suspended ? <UserCheck2 className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                          </button>
                        )}

                        {/* Delete permanently */}
                        {profile.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(profile.id)}
                            className="p-1.5 bg-gray-50 text-red-500 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <EditUserModal
        profile={editingProfile}
        onClose={() => setEditingProfile(null)}
        onSave={handleSaveProfile}
      />

      <UserLogsDrawer
        user={activeLogUser}
        logs={selectedUserLogs}
        onClose={() => setActiveLogUser(null)}
      />
    </div>
  );
}
