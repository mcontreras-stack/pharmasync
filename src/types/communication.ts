export type AttachmentType = 'image' | 'pdf' | 'audio';

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_type: AttachmentType;
  file_name: string;
  file_size: number;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  attachments?: MessageAttachment[];
}

export interface SupportTicketReply {
  sender: string;
  content: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  status: 'open' | 'resolved';
  created_at: string;
  assigned_to?: string;
  replies: SupportTicketReply[];
}
