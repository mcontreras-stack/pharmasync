'use client';

import React, { useState, useEffect } from 'react';
import { Mail, X, Trash2, Calendar, User, Eye, EyeOff } from 'lucide-react';
import { emailService, SentEmail } from '@/services/emailService';

export default function VirtualMailbox() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

  useEffect(() => {
    // Load initial emails
    setTimeout(() => {
      setEmails(emailService.getEmails());
    }, 0);

    const handleNewEmail = (e: Event) => {
      const customEvent = e as CustomEvent<SentEmail>;
      setEmails(emailService.getEmails());
      if (customEvent.detail) {
        setUnread(true);
        // Show floating toast/alert briefly
      }
    };

    window.addEventListener('vitarahealth_new_email', handleNewEmail);
    return () => window.removeEventListener('vitarahealth_new_email', handleNewEmail);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(false);
  };

  const handleClear = () => {
    emailService.clearEmails();
    setEmails([]);
    setSelectedEmail(null);
  };

  const handleNavigate = (link: string) => {
    setIsOpen(false);
    window.location.href = link;
  };

  return (
    <>
      {/* Floating mail trigger button */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={handleOpen}
          className="relative flex items-center justify-center h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-emerald-400/25"
          title="Ver Buzón Virtual de Correos"
        >
          <Mail className="h-6 w-6" />
          {unread && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 text-[8px] font-black text-white items-center justify-center">!</span>
            </span>
          )}
        </button>
      </div>

      {/* Main Mailbox Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Simulador de Correos</h3>
                  <span className="text-[8px] text-gray-500 font-bold block mt-0.5">Sabor Sandbox (Modo Demo)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {emails.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="p-2 text-rose-500 hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
                    title="Vaciar Bandeja"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:bg-slate-850 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {emails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-550 space-y-2 py-20 select-none">
                  <Mail className="h-10 w-10 text-slate-750" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-400">Bandeja de entrada vacía</p>
                    <p className="text-[9px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-normal">
                      Los correos OTP, enlaces de recuperación o recetas de demostración aparecerán aquí.
                    </p>
                  </div>
                </div>
              ) : selectedEmail ? (
                /* View single email detail */
                <div className="space-y-4 animate-fade-in">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-[9px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <EyeOff className="h-3 w-3" /> Volver a la lista
                  </button>

                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">{selectedEmail.subject}</h4>
                      <p className="text-[8px] text-slate-500 mt-1 font-medium">
                        De: <span className="text-slate-400 font-bold">no-reply@vitarahealth.com</span>
                      </p>
                      <p className="text-[8px] text-slate-500 font-medium">
                        Para: <span className="text-slate-400 font-bold">{selectedEmail.to}</span>
                      </p>
                      <p className="text-[8px] text-slate-500 font-medium">
                        Fecha: <span className="text-slate-400 font-bold">{new Date(selectedEmail.sent_at).toLocaleString('es-ES')}</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-850 pt-3">
                      {/* Sandboxed rendering of the HTML mock body */}
                      <div 
                        className="text-[11px] text-slate-300 leading-relaxed space-y-2 select-text p-2 bg-slate-900 border border-slate-800 rounded-xl"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                      />
                    </div>

                    {selectedEmail.link && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleNavigate(selectedEmail.link!)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Eye className="h-4.5 w-4.5" /> Abrir enlace del Correo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* List view of emails */
                <div className="space-y-2.5">
                  {emails.map((mail) => (
                    <div
                      key={mail.id}
                      onClick={() => setSelectedEmail(mail)}
                      className="bg-slate-950 border border-slate-850 hover:border-slate-700 p-3.5 rounded-2xl cursor-pointer hover:bg-slate-900/50 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] font-extrabold text-white truncate max-w-[260px]">{mail.subject}</h4>
                          <p className="text-[9px] text-gray-500 font-semibold truncate max-w-[260px]">Para: {mail.to}</p>
                        </div>
                        <span className="text-[7px] text-gray-600 font-bold uppercase shrink-0 mt-0.5">
                          {new Date(mail.sent_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-2 truncate font-medium">
                        {mail.body.replace(/<[^>]*>/g, '')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
