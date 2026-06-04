import { getMockDb, saveMockDb } from '@/lib/mockDb';

export interface AIResponse {
  text: string;
  tokensPrompt: number;
  tokensCompletion: number;
  costUsd: number;
}

const COST_PER_1K_PROMPT = 0.0015; // Simulated costs (e.g. gpt-4o pricing)
const COST_PER_1K_COMPLETION = 0.002;

export function queryMedicalAI(userId: string, userRole: string, prompt: string, type: 'patient' | 'doctor'): AIResponse {
  // 1. Generate detailed simulated AI clinical responses based on keywords in prompt
  let responseText = '';
  const promptLower = prompt.toLowerCase();

  if (type === 'patient') {
    if (promptLower.includes('receta') || promptLower.includes('hierro') || promptLower.includes('acido folico')) {
      responseText = `Análisis de tu receta:
- **Hierro Aminoquelado (Ferinsol):** Indicado para prevenir o tratar la anemia gestacional. El hierro ayuda a producir hemoglobina para transportar oxígeno al bebé. *Consejo:* Tómalo con jugo de naranja para mejorar la absorción por la vitamina C. Evita lácteos 2 horas antes y después.
- **Ácido Fólico (1 mg):** Fundamental para prevenir defectos del tubo neural en el desarrollo de la médula espinal y cerebro del bebé.`;
    } else if (promptLower.includes('hemograma') || promptLower.includes('laboratorio') || promptLower.includes('sangre')) {
      responseText = `Explicación de laboratorio:
- **Hemoglobina (11.5 g/dL):** Se encuentra en niveles normales para el segundo/tercer trimestre de embarazo (rango ideal >11.0 g/dL). Indica que el tratamiento con hierro está funcionando y no hay anemia severa.
- **Plaquetas:** Normales. Buen estado de coagulación para el parto.`;
    } else if (promptLower.includes('dolor') || promptLower.includes('sintoma') || promptLower.includes('nausea') || promptLower.includes('cabeza')) {
      responseText = `Guía de Síntomas:
- **Náuseas:** Muy comunes debido a los cambios hormonales (gonadotropina coriónica). Se recomienda comer porciones pequeñas y frecuentes, evitar alimentos grasosos y tomar té de jengibre.
- **Dolor de cabeza leve:** Puede asociarse a fatiga o deshidratación. Si se acompaña de visión borrosa, zumbido de oídos (tinnitus) o hinchazón repentina en manos/cara, *¡mide tu presión arterial inmediatamente!* (Podría ser signo de preeclampsia y requiere atención médica urgente).`;
    } else {
      responseText = `Consejo general de salud prenatal:
Durante esta etapa es vital mantener una hidratación abundante (2.5 litros de agua al día), realizar caminatas suaves y asistir a tus controles programados. Monitorea los movimientos del bebé diariamente.`;
    }
  } else {
    // Doctor AI support
    if (promptLower.includes('historial') || promptLower.includes('resumen') || promptLower.includes('evolucion')) {
      responseText = `Síntesis Clínica del Paciente (María López):
- **Diagnóstico Base:** Embarazo activo (Semana 28), anemia gestacional leve controlada.
- **Evolución:** Peso corporal de la madre aumentó gradualmente de 65.5kg a 69.2kg (+3.7kg total). Presión arterial estable (promedio 112/72 mmHg).
- **Riesgo Obstétrico:** Bajo. No se observan signos de alerta de preeclampsia ni diabetes gestacional en laboratorios recientes.
- **Últimos estudios:** Ecografía de semana 22 reporta placenta anterior sin desprendimiento, FCF normal (145 bpm).`;
    } else if (promptLower.includes('alerta') || promptLower.includes('riesgo')) {
      responseText = `Alertas Clínicas de Riesgo:
- **Alerta 1 (Leve):** Historial asmático de la paciente (asma bronquial controlada). Monitorear función pulmonar si presenta tos estacional o disnea.
- **Alerta 2 (Baja):** Anemia gestacional leve en tratamiento con Hierro Aminoquelado. Monitorear hemoglobina en el próximo control de semana 32.`;
    } else {
      responseText = `Resumen clínico ejecutivo generado con base en los últimos controles prenatales registrados de la madre María López y signos vitales reportados en el último mes.`;
    }
  }

  responseText += '\n\n*Esta información es generada por IA y no sustituye el criterio médico profesional.*';

  // 2. Token counts and cost calculations
  const tokensPrompt = Math.floor(prompt.length / 4) + 15;
  const tokensCompletion = Math.floor(responseText.length / 4) + 20;
  const costUsd = parseFloat(
    (((tokensPrompt / 1000) * COST_PER_1K_PROMPT) + ((tokensCompletion / 1000) * COST_PER_1K_COMPLETION)).toFixed(6)
  );

  // 3. Save to ai_interactions log
  try {
    const db = getMockDb();
    const newInteraction = {
      id: `ai-${Date.now()}`,
      user_id: userId,
      prompt,
      response: responseText,
      tokens_prompt: tokensPrompt,
      tokens_completion: tokensCompletion,
      cost_usd: costUsd,
      created_at: new Date().toISOString()
    };
    db.ai_interactions = [newInteraction, ...db.ai_interactions];
    
    // Check if there is high risk alert generated
    if (type === 'doctor' && promptLower.includes('riesgo')) {
      const newAlert = {
        id: `ra-${Date.now()}`,
        pregnancy_id: 'preg-maria-active',
        severity: 'low' as const,
        trigger_reason: 'Auditoría automática de riesgo por antecedente asmático.',
        created_at: new Date().toISOString()
      };
      db.ai_risk_alerts = [newAlert, ...db.ai_risk_alerts];
    }
    
    saveMockDb(db);
  } catch (e) {
    console.error('Error saving AI interaction:', e);
  }

  return {
    text: responseText,
    tokensPrompt,
    tokensCompletion,
    costUsd
  };
}

export const aiService = {
  queryAi: async (userId: string, prompt: string, contextType: 'mother' | 'doctor') => {
    const role = contextType === 'mother' ? 'mother' : 'doctor';
    const result = queryMedicalAI(userId, role, prompt, contextType === 'mother' ? 'patient' : 'doctor');
    return {
      answer: result.text,
      costUsd: result.costUsd
    };
  }
};
