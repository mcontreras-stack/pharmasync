'use client';

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sent_at: string;
  link?: string;
}

const STORAGE_KEY = 'vitarahealth_sent_emails';

export const emailService = {
  getEmails(): SentEmail[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  sendEmail(to: string, subject: string, body: string, link?: string): SentEmail {
    const newEmail: SentEmail = {
      id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to,
      subject,
      body,
      sent_at: new Date().toISOString(),
      link
    };

    if (typeof window !== 'undefined') {
      const emails = this.getEmails();
      const updated = [newEmail, ...emails].slice(0, 50); // limit to 50
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Dispatch custom browser event to update VirtualMailbox UI instantly
      const event = new CustomEvent('vitarahealth_new_email', { detail: newEmail });
      window.dispatchEvent(event);
    }

    return newEmail;
  },

  clearEmails(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('vitarahealth_new_email'));
    }
  }
};
