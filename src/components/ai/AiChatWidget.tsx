'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { aiService } from '@/services/aiService';
import { BrainCircuit, Send, X, AlertTriangle, Coins, Sparkles } from 'lucide-react';

interface AiChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  contextType?: 'mother' | 'doctor';
  patientId?: string;
}

export default function AiChatWidget({ isOpen, onClose, contextType = 'mother', patientId }: AiChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; cost?: number }>>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  // Suggested prompts
  const motherSuggestions = [
    '¿Qué significa tener presión alta en el embarazo?',
    '¿Cuáles son los signos de alarma en el tercer trimestre?',
    '¿Qué cuidados iniciales requiere mi bebé recién nacido?',
    'Explicar los componentes de mi receta médica.'
  ];

  const doctorSuggestions = [
    'Generar resumen clínico del embarazo de la paciente.',
    'Analizar factores de riesgo obstétrico basados en el expediente.',
    'Generar recomendaciones de tamizaje para el bebé.'
  ];

  const suggestions = contextType === 'mother' ? motherSuggestions : doctorSuggestions;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          sender: 'ai', 
          text: contextType === 'mother' 
            ? `¡Hola ${user?.full_name || ''}! Soy tu Asistente Clínico AI de Vitara Health. ¿En qué puedo ayudarte hoy respecto a tus síntomas, recetas o control maternal?`
            : `Hola Dr. ${user?.full_name?.split(' ').pop() || ''}. Estoy lista para ayudarte a generar resúmenes prenatales, redactar notas de evolución o analizar el expediente de este paciente.` 
        }
      ]);
    }
  }, [isOpen, contextType, user]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInputText('');
    setLoading(true);

    try {
      const response = await aiService.queryAi(user.id, text, contextType);
      
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: response.answer,
        cost: response.costUsd
      }]);
      setTotalCost(prev => prev + response.costUsd);
    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: 'Lo siento, ha ocurrido un error al procesar tu consulta con el asistente AI. Inténtalo nuevamente.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs select-text text-left">
      <div className="w-full max-w-md bg-white h-screen shadow-2xl flex flex-col justify-between animate-slide-in relative">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md animate-pulse">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-pink-100 flex items-center gap-1">
                Asistente AI Médico
                <Sparkles className="h-3 w-3 text-amber-300" />
              </h3>
              <p className="text-[10px] text-white/80 font-bold">Vitara Health AI Guard</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* HIPAA Disclaimer & Cost Metrics */}
        <div className="bg-slate-50 border-b border-gray-100 p-2.5 flex justify-between items-center text-[8px] font-bold text-gray-500 uppercase tracking-wider shrink-0 select-none">
          <div className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            HIPAA-SAFE: IA NO SUSTITUYE AL MÉDICO
          </div>
          <div className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
            <Coins className="h-3 w-3" />
            Costo Acumulado: ${(totalCost * 56.5).toFixed(3)} RD$
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 scrollbar-thin">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed font-semibold shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none'
                  : 'bg-white border border-gray-150 text-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              {msg.cost !== undefined && (
                <span className="text-[7px] text-purple-600 font-extrabold tracking-wider mt-1 uppercase mr-1">
                  Costo: ${(msg.cost * 56.5).toFixed(4)} RD$
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 bg-white border border-gray-150 p-3.5 rounded-2xl rounded-tl-none w-max max-w-[80%]">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-[10px] text-gray-400 font-bold italic uppercase tracking-wider animate-pulse">Analizando caso clínico...</span>
            </div>
          )}
        </div>

        {/* Suggestions & Input bar */}
        <div className="p-4 bg-white border-t border-gray-150 shrink-0">
          {messages.length === 1 && !loading && (
            <div className="mb-4 space-y-1.5 select-none">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Preguntas sugeridas:</span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sug)}
                    className="text-[9px] text-left font-bold text-slate-700 hover:text-purple-700 bg-slate-50 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-purple-50 hover:border-purple-200 transition-all cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }} 
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={contextType === 'mother' ? "Pregunta a la IA sobre tus síntomas..." : "Solicita resúmenes o análisis del paciente..."}
              className="flex-1 bg-slate-50 border border-gray-150 rounded-xl p-3 text-xs focus:outline-none focus:bg-white focus:border-purple-400 font-semibold"
              required
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="h-10 w-10 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
