export type SaaSPlanType = 'madre_basico' | 'madre_premium' | 'doc_basico' | 'doc_pro' | 'clinica' | 'hospital' | 'enterprise';

export interface SaaSSubscription {
  id: string;
  user_id: string;
  plan_name: string;
  plan_type: SaaSPlanType;
  status: 'active' | 'past_due' | 'canceled';
  price_paid: number;
  payment_status: 'paid' | 'unpaid' | 'refunded';
  start_date: string;
  end_date: string;
  patient_limit?: number;
  document_limit?: number;
  ai_limit?: number;
  storage_limit?: number;
  created_at: string;
  updated_at: string;
}
