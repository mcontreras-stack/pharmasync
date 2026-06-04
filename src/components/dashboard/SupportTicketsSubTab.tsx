'use client';

import React, { useState } from 'react';
import { getMockDb, saveMockDb, SupportTicket } from '@/lib/mockDb';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Send, X, Clock } from 'lucide-react';

export default function SupportTicketsSubTab() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [showTicketSuccess, setShowTicketSuccess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  if (!user) return null;

  const userTickets = db.support_tickets.filter(t => t.user_id === user.id);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    const newTicket: SupportTicket = {
      id: `tick-${Date.now()}`,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      subject: ticketSubject,
      description: ticketDescription,
      status: 'open',
      created_at: new Date().toISOString(),
      replies: []
    };

    const updatedDb = {
      ...db,
      support_tickets: [newTicket, ...db.support_tickets]
    };

    setDb(updatedDb);
    saveMockDb(updatedDb);
    setTicketSubject('');
    setTicketDescription('');
    setShowTicketSuccess(true);
    setTimeout(() => setShowTicketSuccess(false), 3000);
  };

  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const newReply = {
      sender: user.full_name,
      content: replyText,
      created_at: new Date().toISOString()
    };

    const updatedTickets = db.support_tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return { ...t, replies: [...t.replies, newReply] };
      }
      return t;
    });

    const updatedDb = { ...db, support_tickets: updatedTickets };
    setDb(updatedDb);
    saveMockDb(updatedDb);

    const refreshedTicket = updatedTickets.find(t => t.id === selectedTicket.id);
    if (refreshedTicket) {
      setSelectedTicket(refreshedTicket);
    }
    setReplyText('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 select-none">
      <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
        <MessageSquare className="h-5 w-5 text-pink-500" />
        <h3 className="text-sm font-black text-slate-800">Tickets de Soporte Técnico</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Ticket Form */}
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <h4 className="text-xs font-bold text-gray-700">Crear Nueva Solicitud</h4>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Asunto</label>
            <input
              type="text"
              placeholder="ej. Error al cargar firma digital, Problema de facturación..."
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-semibold">Descripción del Problema</label>
            <textarea
              placeholder="Detalla de la manera más clara el inconveniente presentado..."
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none h-24 resize-none"
              required
            />
          </div>

          {showTicketSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold">
              Ticket creado correctamente. Soporte se comunicará contigo en breve.
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Enviar Solicitud
          </button>
        </form>

        {/* Tickets List */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-gray-700">Mis Consultas Activas ({userTickets.length})</h4>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {userTickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-3 rounded-xl border transition-colors cursor-pointer flex justify-between items-center ${selectedTicket?.id === ticket.id ? 'bg-pink-50/20 border-pink-200' : 'bg-gray-50/40 border-gray-150 hover:bg-gray-50'}`}
              >
                <div>
                  <h5 className="text-[11px] font-bold text-gray-700 truncate max-w-[180px]">{ticket.subject}</h5>
                  <span className="text-[9px] text-gray-400 font-bold block mt-0.5">{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${ticket.status === 'open' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                  {ticket.status === 'open' ? 'Abierto' : 'Resuelto'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Details Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-gray-100 shadow-xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <div>
                <h3 className="font-bold text-sm text-gray-800">{selectedTicket.subject}</h3>
                <span className="text-[9px] text-gray-400 block mt-0.5">Ticket ID: {selectedTicket.id}</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-1 min-h-[160px] max-h-[300px]">
              {/* Ticket description */}
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Caso Inicial</span>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold mt-1">{selectedTicket.description}</p>
                <span className="text-[8px] text-gray-400 block mt-1">{new Date(selectedTicket.created_at).toLocaleString()}</span>
              </div>

              {/* Replies */}
              {selectedTicket.replies.map((rep, idx) => {
                const isAgent = rep.sender !== user.full_name;
                return (
                  <div key={idx} className={`p-3.5 rounded-2xl max-w-[85%] ${isAgent ? 'bg-indigo-50/40 border border-indigo-100/50 mr-auto' : 'bg-pink-50/10 border border-pink-100/50 ml-auto'}`}>
                    <span className="text-[8px] font-black text-slate-450 uppercase block">{isAgent ? rep.sender : 'Tú'}</span>
                    <p className="text-gray-600 font-medium text-[11px] mt-1 leading-relaxed">{rep.content}</p>
                    <span className="text-[8px] text-gray-400 block mt-1">{new Date(rep.created_at).toLocaleTimeString()}</span>
                  </div>
                );
              })}
            </div>

            {selectedTicket.status === 'open' ? (
              <form onSubmit={handleReplyTicket} className="border-t border-gray-100 pt-3 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Escribe una respuesta para el soporte..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="h-10 w-10 bg-pink-500 hover:bg-pink-600 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center text-emerald-800 text-[10px] font-bold">
                Este caso ha sido cerrado y resuelto por soporte administrativo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
