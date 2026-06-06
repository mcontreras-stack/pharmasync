export interface AuditLog {
  id: string;
  user_id?: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  action: string;
  table_affected: string;
  record_id: string;
  old_value?: unknown;
  new_value?: unknown;
  created_at: string;
  event?: string;
  email?: string;
  user_agent?: string;
  is_suspicious?: boolean;
}

export interface AccessLog {
  id: string;
  accessor_id: string;
  patient_id: string;
  accessed_table: string;
  accessed_record_id: string;
  created_at: string;
}

export interface PrivacyRequest {
  id: string;
  user_name: string;
  user_email: string;
  user_id: string;
  request_type: 'export' | 'delete';
  status: 'pending' | 'completed' | 'canceled';
  created_at: string;
}

export interface HipaaConsentLog {
  id: string;
  user_name: string;
  user_id: string;
  consent_type: string;
  version: string | number;
  ip_address: string;
  accepted_at: string;
}

export interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  started_at: string;
  last_activity_at: string;
  revoked_at: string | null;
}
