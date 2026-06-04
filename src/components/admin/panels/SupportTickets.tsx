'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, SupportTicket } from '@/lib/mockDb';
import { MessageSquare, Clock, UserCheck, CheckCircle, AlertCircle, X, Send, UserPlus, RefreshCw } from 'lucide-react';

export default function SupportTickets() {
  const [db, setDb] = useState(getMockDb());
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  // Stats calculation
  const totalTickets = db.support_tickets.length;
  const openTickets = db.support_tickets.filter(t => t.status === 'open');
  const resolvedTickets = db.support_tickets.filter(t => t.status === 'resolved');
  
  const avgResponseTime = '1.8 horas';
  const satisfactionRate = '94.5%';

  // Action: Submit response reply
  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const newReply = {
      sender: 'Admin Juan (Soporte)',
      content: replyText,
      created_at: new Date().toISOString()
    };

    const updatedTickets = db.support_tickets.map(t => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          replies: [...t.replies, newReply],
          assigned_to: 'admin-juan-000'
        };
      }
      return t;
    });

    const updatedDb = { ...db, support_tickets: updatedTickets };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    const refreshedTicket = updatedTickets.find(t => t.id === activeTicket.id);
    if (refreshedTicket) setActiveTicket(refreshedTicket);
    setReplyText('');
  };

  // Action: Assign agent
  const handleAssignAgent = (ticketId: string, agentId: string) => {
    const updatedTickets = db.support_tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, assigned_to: agentId };
      }
      return t;
    });

    const updatedDb = { ...db, support_tickets: updatedTickets };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    const refreshedTicket = updatedTickets.find(t => t.id === ticketId);
    if (refreshedTicket) {
      setActiveTicket(refreshedTicket);
    }
  };

  // Action: Close / Resolve case
  const handleResolveTicket = (ticketId: string) => {
    const updatedTickets = db.support_tickets.map(t => {
      if (t.id === ticketId) {
        // Send notification to user
        const newNotification = {
          id: `not-${Date.now()}`,
          user_id: t.user_id,
          title: 'Ticket de soporte resuelto',
          content: `Tu caso "${t.subject}" ha sido marcado como resuelto. Si tienes más dudas, puedes volver a contactarnos.`,
          type: 'system' as const,
          created_at: new Date().toISOString()
        };
        db.notifications = [newNotification, ...db.notifications];

        return { ...t, status: 'resolved' as const };
      }
      return t;
    });

    const updatedDb = { ...db, support_tickets: updatedTickets };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    const refreshedTicket = updatedTickets.find(t => t.id === ticketId);
    if (refreshedTicket) {
      setActiveTicket(refreshedTicket);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SUPPORT STATS GAUGE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tickets Abiertos', val: openTickets.length, bg: 'bg-amber-50 text-amber-600', icon: <AlertCircle className="h-5 w-5" /> },
          { label: 'Tickets Resueltos', val: resolvedTickets.length, bg: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle className="h-5 w-5" /> },
          { label: 'Tiempo Promedio Rpta', val: avgResponseTime, bg: 'bg-purple-50 text-purple-600', icon: <Clock className="h-5 w-5" /> },
          { label: 'Calificación Servicio', val: satisfactionRate, bg: 'bg-sky-50 text-sky-600', icon: <MessageSquare className="h-5 w-5" /> }
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${c.bg}`}>{c.icon}</div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">{c.label}</span>
              <span className="text-xl font-black text-gray-800">{c.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. TICKETS QUEUE BOARD */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-slate-700 shrink-0" />
          Mesa de Soporte y Atención al Cliente
        </h3>
        <p className="text-[10px] text-gray-400">Resuelve reclamos técnicos, dudas de cobro o solicitudes de pacientes y médicos</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                <th className="py-3 px-4">Ticket / Caso</th>
                <th className="py-3 px-4">Usuario Relacionado</th>
                <th className="py-3 px-4">Asignado A</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Fecha Creación</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {db.support_tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50/30 transition-colors">
                  {/* Case details */}
                  <td className="py-4 px-4">
                    <span className="font-bold text-gray-800 block truncate max-w-xs">{ticket.subject}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5 truncate max-w-xs">{ticket.description}</span>
                  </td>

                  {/* Creator */}
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-700 block">{ticket.user_name}</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">{ticket.user_email}</span>
                  </td>

                  {/* Assigner */}
                  <td className="py-4 px-4 font-medium text-gray-600">
                    {ticket.assigned_to ? (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase text-[9px]">
                        Admin Juan
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-[10px]">Sin asignar</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                      {ticket.status === 'open' ? 'Abierto' : 'Resuelto'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-4 px-4 text-gray-450 font-semibold">
                    {new Date(ticket.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => setActiveTicket(ticket)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold shadow-xs transition-colors"
                    >
                      Atender Caso
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED INTERACTIVE CHAT DRAWER */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white h-screen shadow-2xl p-6 border-l border-gray-100 flex flex-col justify-between animate-slide-in">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className={`text-[8px] px-2 py-0.25 rounded-md font-bold uppercase block w-max mb-1 ${activeTicket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    Caso N° {activeTicket.id} ({activeTicket.status})
                  </span>
                  <h3 className="text-sm font-black text-slate-800">{activeTicket.subject}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Usuario: {activeTicket.user_name} ({activeTicket.user_email})</p>
                </div>
                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-2 text-gray-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Assignment controls */}
              <div className="flex items-center justify-between py-2 border-b border-gray-100 bg-slate-50 px-4 rounded-xl mt-3 text-[10px] font-bold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-slate-500" />
                  Asignado a: {activeTicket.assigned_to ? 'Admin Juan' : 'Nadie'}
                </span>
                <div className="flex gap-2">
                  {!activeTicket.assigned_to && (
                    <button
                      onClick={() => handleAssignAgent(activeTicket.id, 'admin-juan-000')}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[8px] font-extrabold uppercase transition-all"
                    >
                      Asignarme a mí
                    </button>
                  )}
                  {activeTicket.status === 'open' && (
                    <button
                      onClick={() => handleResolveTicket(activeTicket.id)}
                      className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-[8px] font-extrabold uppercase transition-all"
                    >
                      Marcar Resuelto
                    </button>
                  )}
                </div>
              </div>

              {/* Message replies list */}
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-2 scrollbar-thin flex flex-col">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-100 text-xs">
                  <span className="font-bold text-gray-700 block">{activeTicket.user_name} (Creador)</span>
                  <p className="text-gray-500 font-medium mt-1 leading-relaxed">{activeTicket.description}</p>
                  <span className="text-[8px] text-gray-400 block text-right mt-1.5">{new Date(activeTicket.created_at).toLocaleString('es-ES')}</span>
                </div>

                {activeTicket.replies.map((rep, idx) => {
                  const isAdmin = rep.sender.includes('Soporte') || rep.sender.includes('Admin');
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs max-w-[90%] border ${isAdmin ? 'bg-sky-50 border-sky-100 self-end text-right' : 'bg-slate-50 border-gray-100 self-start'}`}
                    >
                      <span className="font-bold text-slate-800 block">{rep.sender}</span>
                      <p className="text-gray-600 font-medium mt-1 leading-relaxed">{rep.content}</p>
                      <span className="text-[8px] text-gray-400 block mt-1">{new Date(rep.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit message form */}
            {activeTicket.status === 'open' ? (
              <form onSubmit={handleSubmitReply} className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Escribe una respuesta oficial..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-slate-400 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center text-emerald-800 text-[10px] font-bold mt-4">
                Este caso ha sido cerrado y resuelto. No se admiten respuestas adicionales.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
