'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/lib/mockDb';
import { Search, UserCheck, UserX, Trash2, Edit2, FileText, UserCheck2, Eye, X, History, AlertCircle, Check } from 'lucide-react';
import EditUserModal from './EditUserModal';
import UserLogsDrawer from './UserLogsDrawer';
import { supabase } from '@/lib/supabase';
import { getAllUsers, suspendUser, reactivateUser } from '@/services/adminService';

type RealProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  avatar_url?: string;
  is_suspended?: boolean;
};

export default function UserManagement() {
  const [profiles, setProfiles] = useState<RealProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'mother' | 'obstetrician' | 'pediatrician' | 'admin'>('all');

  // Drawer & Modal States
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [activeLogUser, setActiveLogUser] = useState<Profile | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const usersList = await getAllUsers();
      const mapped: RealProfile[] = usersList.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        status: u.status,
        avatar_url: u.avatar_url,
        is_suspended: u.status === 'suspended',
      }));
      setProfiles(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al cargar usuarios';
      console.error('[UserManagement] loadData error:', err);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filters
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch =
      (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || p.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Action: Suspend / Reactivate
  const toggleSuspension = async (userId: string) => {
    const target = profiles.find(p => p.id === userId);
    if (!target) return;
    const nextSuspended = !target.is_suspended;

    try {
      if (nextSuspended) {
        await suspendUser(userId, 'Suspendido por administrador');
      } else {
        await reactivateUser(userId);
      }
      setProfiles(prev =>
        prev.map(p =>
          p.id === userId
            ? { ...p, is_suspended: nextSuspended, status: nextSuspended ? 'suspended' : 'approved' }
            : p
        )
      );
    } catch (err) {
      console.error('[UserManagement] toggleSuspension error:', err);
    }
  };

  // Action: Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      await supabase.from('profiles').delete().eq('id', userId);
      setProfiles(prev => prev.filter(p => p.id !== userId));
    } catch (err) {
      console.error('[UserManagement] delete error:', err);
    }
  };

  // Action: Approve user
  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', userId);
      if (!error) {
        setProfiles(prev =>
          prev.map(p => (p.id === userId ? { ...p, status: 'approved' } : p))
        );
      }
    } catch (err) {
      console.error('[UserManagement] approve error:', err);
    }
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      mother: 'MADRE',
      obstetrician: 'OBSTETRA',
      pediatrician: 'PEDIATRA',
      admin: 'ADMIN',
    };
    return map[role] || role.toUpperCase();
  };

  const getRoleBadgeClass = (role: string) => {
    const map: Record<string, string> = {
      mother: 'bg-pink-100 text-pink-700',
      obstetrician: 'bg-sky-100 text-sky-700',
      pediatrician: 'bg-emerald-100 text-emerald-700',
      admin: 'bg-slate-800 text-white',
    };
    return map[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      approved:          { label: 'ACTIVO',         cls: 'bg-emerald-100 text-emerald-700' },
      under_review:      { label: 'EN REVISIÓN',    cls: 'bg-amber-100 text-amber-700' },
      email_pending:     { label: 'EN REVISIÓN',    cls: 'bg-amber-100 text-amber-700' },
      pending_documents: { label: 'DOCS PENDIENTE', cls: 'bg-orange-100 text-orange-700' },
      suspended:         { label: 'SUSPENDIDO',     cls: 'bg-rose-100 text-rose-700' },
      rejected:          { label: 'RECHAZADO',      cls: 'bg-gray-100 text-gray-500' },
    };
    const d = map[status] || { label: status.toUpperCase(), cls: 'bg-gray-100 text-gray-500' };
    return <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${d.cls}`}>{d.label}</span>;
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h2 className="text-base font-black text-slate-800">Listado de Usuarios Registrados</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Controla perfiles, edita credenciales y suspende accesos</p>
        </div>
      </div>

      {/* Error Banner */}
      {loadError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span className="text-xs font-black text-rose-700">Error al cargar usuarios desde Supabase</span>
          </div>
          <p className="text-[11px] text-rose-600">{loadError}</p>
          <p className="text-[10px] text-rose-500">
            Posibles causas: (1) Falta política RLS. (2) La tabla <code className="bg-rose-100 px-1 rounded">profiles</code> no existe.
            Ejecuta el <strong>supabase-setup.sql</strong> en Supabase Studio.
          </p>
          <button onClick={loadData} className="text-[10px] font-black text-rose-700 hover:text-rose-900 underline cursor-pointer">
            Reintentar
          </button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-200 placeholder:text-gray-400"
          />
        </div>
        <div className="flex gap-2 text-[10px] font-bold">
          {(['all', 'mother', 'obstetrician', 'pediatrician', 'admin'] as const).map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                selectedRole === role
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-slate-400'
              }`}
            >
              {role === 'all' ? 'Todos' : role === 'mother' ? 'Madres' : role === 'obstetrician' ? 'Obstetras' : role === 'pediatrician' ? 'Pediatras' : 'Admins'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-pink-500 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadError && filteredProfiles.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Search className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-500">
            {profiles.length === 0 ? 'No hay usuarios registrados aún' : 'Ningún usuario coincide con el filtro'}
          </p>
          <p className="text-xs text-slate-400">
            {profiles.length === 0
              ? 'Los usuarios aparecerán aquí una vez que se registren en la plataforma'
              : 'Prueba con otro término de búsqueda o categoría'}
          </p>
        </div>
      )}

      {/* Users Table */}
      {!loading && filteredProfiles.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Usuario</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rol de Cuenta</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado</span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Acciones y Auditoría</span>
          </div>

          {filteredProfiles.map((profile, idx) => (
            <div
              key={profile.id}
              className={`grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center ${
                idx !== filteredProfiles.length - 1 ? 'border-b border-gray-50' : ''
              } hover:bg-slate-50/50 transition-colors`}
            >
              {/* User Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                  {getInitials(profile.full_name || profile.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{profile.full_name || '—'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{profile.email} · ID: {profile.id.slice(0, 8)}...</p>
                </div>
              </div>

              {/* Role */}
              <div>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${getRoleBadgeClass(profile.role)}`}>
                  {getRoleLabel(profile.role)}
                </span>
              </div>

              {/* Status */}
              <div>
                {getStatusBadge(profile.status)}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Approve button */}
                {profile.role !== 'admin' && ['under_review', 'pending_documents', 'email_pending'].includes(profile.status) && (
                  <button
                    onClick={() => handleApproveUser(profile.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                    title="Aprobar usuario"
                  >
                    <Check className="h-3 w-3" />
                    Aprobar
                  </button>
                )}

                {/* Suspend / Reactivate */}
                {profile.role !== 'admin' && (
                  <button
                    onClick={() => toggleSuspension(profile.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      profile.is_suspended
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                    title={profile.is_suspended ? 'Reactivar' : 'Suspender'}
                  >
                    {profile.is_suspended ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => setEditingProfile(profile as unknown as Profile)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="h-3 w-3" />
                </button>

                {/* Logs */}
                <button
                  onClick={() => setActiveLogUser(profile as unknown as Profile)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Ver historial"
                >
                  <History className="h-3 w-3" />
                </button>

                {/* Delete */}
                {profile.role !== 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(profile.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {editingProfile && (
        <EditUserModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={async (name: string, email: string) => {
            await supabase
              .from('profiles')
              .update({ full_name: name, email })
              .eq('id', editingProfile.id);
            setProfiles(prev =>
              prev.map(p => p.id === editingProfile.id ? { ...p, full_name: name, email } : p)
            );
            setEditingProfile(null);
          }}
        />
      )}
      {activeLogUser && (
        <UserLogsDrawer
          user={activeLogUser}
          logs={[]}
          onClose={() => setActiveLogUser(null)}
        />
      )}
    </div>
  );
}
