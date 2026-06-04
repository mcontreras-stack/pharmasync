export interface AuditLog {
  id: string;
  user_id?: string;
  user_email: string;
  user_role: string;
  ip_address: string;
  action: string;
  table_affected: string;
  record_id: string;
  old_value?: any;
  new_value?: any;
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
