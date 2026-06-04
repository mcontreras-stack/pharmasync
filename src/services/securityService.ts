import { getMockDb, saveMockDb } from '@/lib/mockDb';

export interface SecurityEventInput {
  userId?: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export function logSecurityEvent(event: SecurityEventInput) {
  try {
    const db = getMockDb();
    const newEvent = {
      id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: event.userId || null,
      event_type: event.eventType,
      severity: event.severity,
      description: event.description,
      created_at: new Date().toISOString()
    };
    db.security_events = [newEvent, ...db.security_events];
    saveMockDb(db);
    console.log(`[HIPAA Security Event] ${event.severity.toUpperCase()}: ${event.description}`);
  } catch (e) {
    console.error('Error logging security event:', e);
  }
}

export function logDataAccess(accessorId: string, patientId: string, table: string, recordId: string) {
  try {
    const db = getMockDb();
    const newLog = {
      id: `acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accessor_id: accessorId,
      patient_id: patientId,
      accessed_table: table,
      accessed_record_id: recordId,
      created_at: new Date().toISOString()
    };
    db.access_logs = [newLog, ...db.access_logs];
    saveMockDb(db);
  } catch (e) {
    console.error('Error logging HIPAA access:', e);
  }
}

export function startUserSession(userId: string): string {
  try {
    const db = getMockDb();
    const sessionId = `sess-${Date.now()}`;
    const newSession = {
      id: sessionId,
      user_id: userId,
      ip_address: '127.0.0.1', // Simulated IP
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'NodeJS',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      revoked_at: null
    };
    db.user_sessions = [newSession, ...db.user_sessions];
    saveMockDb(db);
    return sessionId;
  } catch (e) {
    console.error('Error starting user session:', e);
    return `sess-fallback-${Date.now()}`;
  }
}

export function updateUserSessionActivity(sessionId: string) {
  try {
    const db = getMockDb();
    db.user_sessions = db.user_sessions.map(s => 
      s.id === sessionId ? { ...s, last_activity_at: new Date().toISOString() } : s
    );
    saveMockDb(db);
  } catch (e) {
    console.error('Error updating session activity:', e);
  }
}

export function revokeUserSession(sessionId: string) {
  try {
    const db = getMockDb();
    db.user_sessions = db.user_sessions.map(s => 
      s.id === sessionId ? { ...s, revoked_at: new Date().toISOString() } : s
    );
    saveMockDb(db);
  } catch (e) {
    console.error('Error revoking session:', e);
  }
}

export const securityService = {
  logAccess: (accessorId: string, patientId: string, table: string, recordId: string) => {
    logDataAccess(accessorId, patientId, table, recordId);
  },
  logSecurityEvent,
  startUserSession,
  updateUserSessionActivity,
  revokeUserSession
};
