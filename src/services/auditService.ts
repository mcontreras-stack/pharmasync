import { getMockDb, saveMockDb } from '@/lib/mockDb';
import { AuditLog } from '@/types/database';

export interface AuditInput {
  userId?: string;
  userEmail: string;
  userRole: string;
  action: string;
  tableAffected: string;
  recordId: string;
  oldValue?: any;
  newValue?: any;
}

export function logDataChange(input: AuditInput) {
  try {
    const db = getMockDb();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: input.userId || undefined,
      user_email: input.userEmail,
      user_role: input.userRole,
      ip_address: '127.0.0.1', // Simulated IP
      action: input.action,
      table_affected: input.tableAffected,
      record_id: input.recordId,
      old_value: input.oldValue || null,
      new_value: input.newValue || null,
      created_at: new Date().toISOString()
    };
    db.audit_logs = [newLog, ...db.audit_logs];
    saveMockDb(db);
    console.log(`[HIPAA Audit Log] ${input.action.toUpperCase()} on ${input.tableAffected} (${input.recordId})`);
  } catch (e) {
    console.error('Error logging data change audit:', e);
  }
}

export const auditService = {
  logAction: (
    userId: string | undefined,
    userEmail: string,
    userRole: string,
    action: string,
    tableAffected: string,
    recordId: string,
    oldValue?: any,
    newValue?: any
  ) => {
    logDataChange({
      userId,
      userEmail,
      userRole,
      action,
      tableAffected,
      recordId,
      oldValue,
      newValue
    });
  }
};
