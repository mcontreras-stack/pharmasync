export interface AIInteraction {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  tokens_prompt: number;
  tokens_completion: number;
  cost_usd: number;
  created_at: string;
}

export interface AIRiskAlert {
  id: string;
  pregnancy_id?: string;
  baby_id?: string;
  severity: 'low' | 'medium' | 'high';
  trigger_reason: string;
  created_at: string;
}
