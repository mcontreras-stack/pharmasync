import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { getAllUsers, suspendUser, reactivateUser, changeUserRole, UserProfile } from '@/services/adminService';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'reactivate' | 'changeRole' | null>(null);
  const [newRole, setNewRole] = useState<'mother' | 'obstetrician' | 'pediatrician' | 'admin'>('mother');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (user: UserProfile) => {
    setSelectedUser(user);
    setActionType('suspend');
    setShowModal(true);
  };

  const handleReactivate = async (user: UserProfile) => {
    setSelectedUser(user);
    setActionType('reactivate');
    setShowModal(true);
  };

  const handleChangeRole = async (user: UserProfile) => {
    setSelectedUser(user);
    setActionType('changeRole');
    setNewRole(user.role as any);
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      if (actionType === 'suspend') {
        await suspendUser(selectedUser.id, 'Suspendido por administrador');
      } else if (actionType === 'reactivate') {
        await reactivateUser(selectedUser.id);
      } else if (actionType === 'changeRole') {
        await changeUserRole(selectedUser.id, newRole);
      }

      setShowModal(false);
      setSelectedUser(null);
      setActionType(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error al realizar la acción');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'obstetrician':
      case 'pediatrician':
        return 'bg-green-100 text-green-800';
      case 'mother':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending_documents':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/admin')}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2"
            >
              ← Volver al Panel
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-bold">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'obstetrician' ? 'Obstetra' : user.role === 'pediatrician' ? 'Pediatra' : user.role === 'admin' ? 'Admin' : 'Madre'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status === 'approved' ? 'Aprobado' : user.status === 'suspended' ? 'Suspendido' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleChangeRole(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Cambiar Rol
                    </button>
                    {user.status === 'approved' ? (
                      <button
                        onClick={() => handleSuspend(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Suspender
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(user)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Reactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'suspend' && 'Suspender Usuario'}
              {actionType === 'reactivate' && 'Reactivar Usuario'}
              {actionType === 'changeRole' && 'Cambiar Rol'}
            </h2>

            {actionType === 'changeRole' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Rol
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="mother">Madre</option>
                  <option value="obstetrician">Obstetra</option>
                  <option value="pediatrician">Pediatra</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              {actionType === 'suspend' && `¿Estás seguro de que deseas suspender a ${selectedUser.full_name}?`}
              {actionType === 'reactivate' && `¿Estás seguro de que deseas reactivar a ${selectedUser.full_name}?`}
              {actionType === 'changeRole' && `¿Cambiar el rol de ${selectedUser.full_name} a ${newRole}?`}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                  setActionType(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
