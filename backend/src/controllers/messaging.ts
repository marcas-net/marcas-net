import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id as string;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      include: {
        participant1: { select: { id: true, name: true, avatarUrl: true } },
        participant2: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const mapped = conversations.map((c) => {
      const other = c.participant1Id === userId ? c.participant2 : c.participant1;
      const lastMessage = c.messages[0] || null;
      return {
        id: c.id,
        otherUser: other,
        lastMessage: lastMessage ? { content: lastMessage.content, createdAt: lastMessage.createdAt, isRead: lastMessage.isRead, senderId: lastMessage.senderId } : null,
        updatedAt: c.updatedAt,
      };
    });

    res.json({ conversations: mapped });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id as string;
    const conversationId = req.params.conversationId as string as string;

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: { conversationId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    const senderId = req.user.id;
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return res.status(404).json({ error: 'User not found' });

    // Find or create conversation (order participants consistently)
    const [p1, p2] = [senderId, receiverId].sort();
    let conversation = await prisma.conversation.findUnique({
      where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { participant1Id: p1, participant2Id: p2 },
      });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId,
        receiverId,
        conversationId: conversation.id,
      },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ message, conversationId: conversation.id });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.message.count({
      where: { receiverId: req.user.id, isRead: false },
    });
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
