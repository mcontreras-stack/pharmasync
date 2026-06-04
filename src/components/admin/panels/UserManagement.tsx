'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, Profile } from '@/lib/mockDb';
import {
  Search,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  FileText,
  UserCheck2,
  Eye,
  X,
  History,
  AlertCircle
} from 'lucide-react';

export default function UserManagement() {
  const [db, setDb] = useState(getMockDb());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'mother' | 'obstetrician' | 'pediatrician' | 'admin'>('all');
  
  // Drawer & Modal States
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  const [activeLogUser, setActiveLogUser] = useState<Profile | null>(null);

  // Filters
  const filteredProfiles = db.profiles.filter(p => {
    const matchesSearch = 
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || p.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Action: Suspend / Reactivate
  const toggleSuspension = (userId: string) => {
    const updatedProfiles = db.profiles.map(p => {
      if (p.id === userId) {
        const nextStatus = !p.is_suspended;
        
        // Log security audit event
        const newLog = {
          id: `log-${Date.now()}`,
          user_id: 'admin-juan-000',
          event: `${nextStatus ? 'Cuenta Suspendida' : 'Cuenta Reactivada'} para usuario ${p.email}`,
          ip_address: '190.16.200.45',
          user_agent: 'Chrome/124.0.0.0 (Windows 11)',
          created_at: new Date().toISOString(),
          is_suspicious: false
        };
        db.audit_logs = [newLog, ...db.audit_logs];

        return { ...p, is_suspended: nextStatus };
      }
      return p;
    });

    const updatedDb = { ...db, profiles: updatedProfiles };
    setDb(updatedDb);
    saveMockDb(updatedDb);
  };

  // Action: Delete Account
  const handleDeleteUser = (userId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta cuenta? Esta acción no se puede deshacer.')) return;

    const targetProfile = db.profiles.find(p => p.id === userId);
    const updatedProfiles = db.profiles.filter(p => p.id !== userId);
    const updatedMothers = db.mothers.filter(m => m.id !== userId);
    const updatedDoctors = db.doctors.filter(d => d.id !== userId);

    // Log security audit event
    const newLog = {
      id: `log-${Date.now()}`,
      user_id: 'admin-juan-000',
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
  };

  // Action: Save Edit profile detail
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    const updatedProfiles = db.profiles.map(p => {
      if (p.id === editingProfile.id) {
        return { ...p, full_name: editName, email: editEmail };
      }
      return p;
    });

    const updatedDb = { ...db, profiles: updatedProfiles };
    setDb(updatedDb);
    saveMockDb(updatedDb);
    setEditingProfile(null);
  };

  // Action: Impersonation Trigger
  const handleImpersonate = (targetUser: Profile) => {
    if (typeof window === 'undefined') return;
    
    // Save current admin user so we can return back
    const currentAdmin = localStorage.getItem('pharmasync_user');
    if (currentAdmin) {
      localStorage.setItem('pharmasync_admin_impersonator', currentAdmin);
    }
    
    // Set active session user to target profile
    localStorage.setItem('pharmasync_user', JSON.stringify(targetUser));
    
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
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${profile.is_suspended ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {profile.is_suspended ? 'Suspendido' : 'Activo'}
                      </span>
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

                        {/* Edit details */}
                        <button
                          onClick={() => {
                            setEditingProfile(profile);
                            setEditName(profile.full_name);
                            setEditEmail(profile.email);
                          }}
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

      {/* MODAL: EDIT USER PROFILE */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] border border-gray-100 w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingProfile(null)}
              className="absolute right-4 top-4 p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-slate-700" />
              Editar Perfil de Usuario
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Modifica los datos del expediente general de la cuenta</p>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-slate-400"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: USER ACCESS LOGS */}
      {activeLogUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 border-l border-gray-100 flex flex-col justify-between animate-slide-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-sky-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Bitácora de Seguridad</h3>
                    <p className="text-[10px] text-sky-600 font-semibold">{activeLogUser.full_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveLogUser(null)}
                  className="p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Logs loop */}
              <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 scrollbar-thin">
                {selectedUserLogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 font-medium text-xs flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8 text-gray-300" />
                    No hay registros de seguridad guardados para este usuario.
                  </div>
                ) : (
                  selectedUserLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-2xl border text-xs relative ${log.is_suspicious ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-gray-100'}`}
                    >
                      {log.is_suspicious && (
                        <span className="absolute top-3 right-3 text-[8px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-md animate-pulse">
                          Sospechoso
                        </span>
                      )}
                      <h4 className="font-bold text-slate-800 pr-12">{log.event}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Origen IP: {log.ip_address}</p>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate" title={log.user_agent}>
                        UA: {log.user_agent}
                      </p>
                      <span className="text-[9px] text-gray-400 block mt-2 text-right font-medium">
                        {new Date(log.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveLogUser(null)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Cerrar Bitácora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
