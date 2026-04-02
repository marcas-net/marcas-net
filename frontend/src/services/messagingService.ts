import api from './api';

export interface ConversationUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface LastMessage {
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: string;
}

export interface Conversation {
  id: string;
  otherUser: ConversationUser;
  lastMessage: LastMessage | null;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  isRead: boolean;
  sender: { id: string; name: string; avatarUrl: string | null };
  createdAt: string;
}

export const getConversations = async (): Promise<Conversation[]> => {
  const res = await api.get('/messages/conversations');
  return res.data.conversations;
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const res = await api.get(`/messages/conversations/${conversationId}`);
  return res.data.messages;
};

export const sendMessage = async (receiverId: string, content: string): Promise<{ message: Message; conversationId: string }> => {
  const res = await api.post('/messages/send', { receiverId, content });
  return res.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await api.get('/messages/unread');
  return res.data.unreadCount;
};
