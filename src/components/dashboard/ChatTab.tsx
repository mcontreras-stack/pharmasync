'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMockDb, saveMockDb, Profile, Message } from '@/lib/mockDb';
import { Send, User, Check, CheckCheck } from 'lucide-react';

export default function ChatTab() {
  const { user } = useAuth();
  const [db, setDb] = useState(getMockDb());
  const [activeChatUserId, setActiveChatUserId] = useState<string>('');
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  // Query users that are connected for chat
  // If Mother: Obstetrician (Dra. Ana) and Pediatrician (Dr. Andrés)
  // If Doctor: Linked mothers
  let chatParticipants: Profile[] = [];
  if (user.role === 'mother') {
    chatParticipants = db.profiles.filter(p => p.role === 'obstetrician' || p.role === 'pediatrician');
  } else {
    // Doctors only chat with mothers connected to them
    chatParticipants = db.profiles.filter(p => {
      if (p.role !== 'mother') return false;
      return db.doctor_patient_links.some(dpl => dpl.doctor_id === user.id && dpl.mother_id === p.id && dpl.status === 'active');
    });
  }

  // Set default active chat user if not set
  useEffect(() => {
    if (chatParticipants.length > 0 && !activeChatUserId) {
      setActiveChatUserId(chatParticipants[0].id);
    }
  }, [chatParticipants, activeChatUserId]);

  // Scroll to bottom when active user or messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatUserId, db.messages]);

  const activeChatUser = db.profiles.find(p => p.id === activeChatUserId);

  // Filter messages between user and activeChatUserId
  const chatMessages = db.messages.filter(m => 
    (m.sender_id === user.id && m.receiver_id === activeChatUserId) ||
    (m.sender_id === activeChatUserId && m.receiver_id === user.id)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !activeChatUserId) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender_id: user.id,
      receiver_id: activeChatUserId,
      content: inputVal,
      created_at: new Date().toISOString()
    };

    const updatedDb = {
      ...db,
      messages: [...db.messages, newMsg]
    };
    setDb(updatedDb);
    saveMockDb(updatedDb);
    setInputVal('');
  };

  // Border theme colors
  let roleColor = 'text-pink-600 bg-pink-500 hover:bg-pink-600';
  let activeBorder = 'border-pink-500';
  let activeBg = 'bg-pink-50';
  let activeText = 'text-pink-600';

  if (user.role === 'obstetrician') {
    roleColor = 'text-purple-600 bg-purple-500 hover:bg-purple-600';
    activeBorder = 'border-purple-500';
    activeBg = 'bg-purple-50';
    activeText = 'text-purple-600';
  } else if (user.role === 'pediatrician') {
    roleColor = 'text-emerald-600 bg-emerald-500 hover:bg-emerald-600';
    activeBorder = 'border-emerald-500';
    activeBg = 'bg-emerald-50';
    activeText = 'text-emerald-600';
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-[calc(100vh-210px)] min-h-[420px] grid grid-cols-1 md:grid-cols-3 overflow-hidden select-none">
      {/* Chats roster list */}
      <div className="border-r border-gray-100 p-4 space-y-4 flex flex-col h-full overflow-hidden">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 px-1">
          Canales de Consulta
        </h3>
        <div className="space-y-1 overflow-y-auto flex-1">
          {chatParticipants.map(participant => {
            const isSelected = participant.id === activeChatUserId;
            const lastMsg = db.messages
              .filter(m => 
                (m.sender_id === user.id && m.receiver_id === participant.id) ||
                (m.sender_id === participant.id && m.receiver_id === user.id)
              )
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            return (
              <div
                key={participant.id}
                onClick={() => setActiveChatUserId(participant.id)}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 ${isSelected ? `${activeBg} ${activeBorder} border` : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'}`}
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? `${roleColor.split(' ')[1]} text-white` : 'bg-gray-200 text-gray-600'}`}>
                  {participant.full_name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-800 truncate">{participant.full_name}</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                    {lastMsg ? lastMsg.content : 'Inicia una conversación...'}
                  </p>
                </div>
              </div>
            );
          })}

          {chatParticipants.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-6">No hay chats activos. Asegúrate de tener médicos vinculados.</p>
          )}
        </div>
      </div>

      {/* Chat conversation box */}
      <div className="md:col-span-2 flex flex-col h-full justify-between bg-gray-50/30 overflow-hidden">
        {activeChatUser ? (
          <>
            {/* Header info */}
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 text-white rounded-full flex items-center justify-center font-bold text-xs ${roleColor.split(' ')[1]}`}>
                  {activeChatUser.full_name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-800">{activeChatUser.full_name}</h3>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase block tracking-wider mt-0.5">En Línea</span>
                </div>
              </div>
            </div>

            {/* Messages box list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((msg) => {
                const isOwn = msg.sender_id === user.id;
                const timeStr = new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${isOwn ? `${roleColor.split(' ')[1]} text-white rounded-tr-none` : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}`}
                    >
                      <p>{msg.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[8px] ${isOwn ? 'text-pink-100' : 'text-gray-400'}`}>
                        <span>{timeStr}</span>
                        {isOwn && <CheckCheck className="h-3 w-3 text-white/80" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input send message bar */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-100 p-4 flex gap-2">
              <input
                type="text"
                placeholder="Escribe tu consulta médica..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-pink-300"
              />
              <button
                type="submit"
                className={`p-2.5 ${roleColor.split(' ')[1]} hover:${roleColor.split(' ')[2]} text-white rounded-xl shadow-xs transition-colors`}
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic">
            Selecciona un canal para conversar.
          </div>
        )}
      </div>
    </div>
  );
}
