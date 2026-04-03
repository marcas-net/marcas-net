import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getConversations, getMessages, sendMessage,
  type Conversation, type Message,
} from '../services/messagingService';
import { listUsers, type UserListItem } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active conversation's other user
  const activeConvo = conversations.find((c) => c.id === activeConversationId);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle ?to= param for new message from profile page
  useEffect(() => {
    const toUserId = searchParams.get('to');
    if (toUserId && conversations.length > 0) {
      const existing = conversations.find(
        (c) => c.otherUser.id === toUserId
      );
      if (existing) {
        setActiveConversationId(existing.id);
        searchParams.delete('to');
        setSearchParams(searchParams, { replace: true });
      } else {
        // Will need to start new convo
        setShowNewMessage(true);
      }
    }
  }, [conversations, searchParams, setSearchParams]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConvos(true);
    try {
      const convos = await getConversations();
      setConversations(convos);
      if (convos.length > 0 && !activeConversationId) {
        setActiveConversationId(convos[0].id);
      }
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConvos(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(conversationId);
      setMessages(msgs);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConvo) return;
    setSending(true);
    try {
      const { message } = await sendMessage(activeConvo.otherUser.id, messageText.trim());
      setMessages((prev) => [...prev, message]);
      setMessageText('');
      // Refresh conversation list to update last message
      loadConversations();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleNewMessage = async (receiverId: string) => {
    setShowNewMessage(false);
    setUserSearch('');
    // Check if conversation exists
    const existing = conversations.find((c) => c.otherUser.id === receiverId);
    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }
    // Send an initial empty check — just open the conversation
    // We'll set it up when first message is sent
    setSending(true);
    try {
      const { conversationId } = await sendMessage(receiverId, 'Hey!');
      await loadConversations();
      setActiveConversationId(conversationId);
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setSending(false);
    }
  };

  const loadUsers = async (search: string) => {
    try {
      const allUsers = await listUsers();
      setUsers(allUsers.filter((u) =>
        u.id !== user?.id &&
        (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
      ));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (showNewMessage) {
      loadUsers(userSearch);
    }
  }, [showNewMessage, userSearch]);

  return (
    <div className="max-w-5xl mx-auto">
      <Card padding="none" className="overflow-hidden">
        <div className="flex h-[calc(100vh-10rem)]">
          {/* ─── Conversation List ─── */}
          <div className="w-80 border-r border-slate-200 dark:border-neutral-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-neutral-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Messages</h2>
              <button
                onClick={() => setShowNewMessage(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                title="New message"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            </div>

            {/* New message panel */}
            {showNewMessage && (
              <div className="p-3 border-b border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900/50">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search people..."
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-xs text-slate-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleNewMessage(u.id)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                    >
                      <Avatar name={u.name ?? u.email} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{u.name ?? u.email}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                  {users.length === 0 && userSearch && (
                    <p className="text-[10px] text-slate-400 text-center py-2">No users found</p>
                  )}
                </div>
                <button
                  onClick={() => { setShowNewMessage(false); setUserSearch(''); }}
                  className="mt-2 w-full text-[10px] text-slate-400 hover:text-slate-600 text-center"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvos ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-neutral-600 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-200 dark:bg-neutral-600 rounded w-24" />
                        <div className="h-2.5 bg-slate-200 dark:bg-neutral-600 rounded w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs text-slate-400">No conversations yet</p>
                  <button
                    onClick={() => setShowNewMessage(true)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Start a conversation
                  </button>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConversationId(convo.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeConversationId === convo.id
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-r-2 border-blue-600'
                        : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <Avatar name={convo.otherUser.name} size="md" src={convo.otherUser.avatarUrl ?? undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {convo.otherUser.name}
                        </p>
                        {convo.lastMessage && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                            {timeAgo(convo.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {convo.lastMessage && (
                        <p className={`text-[11px] truncate mt-0.5 ${
                          !convo.lastMessage.isRead && convo.lastMessage.senderId !== user?.id
                            ? 'text-slate-700 dark:text-slate-300 font-medium'
                            : 'text-slate-400'
                        }`}>
                          {convo.lastMessage.senderId === user?.id ? 'You: ' : ''}
                          {convo.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {convo.lastMessage && !convo.lastMessage.isRead && convo.lastMessage.senderId !== user?.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ─── Message Thread ─── */}
          <div className="flex-1 flex flex-col">
            {activeConvo ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-slate-200 dark:border-neutral-700 flex items-center gap-3">
                  <Avatar name={activeConvo.otherUser.name} size="md" src={activeConvo.otherUser.avatarUrl ?? undefined} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeConvo.otherUser.name}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-slate-400">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-end gap-2 max-w-[70%] ${isMine ? 'flex-row-reverse' : ''}`}>
                            {!isMine && (
                              <Avatar name={msg.sender.name} size="xs" src={msg.sender.avatarUrl ?? undefined} />
                            )}
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                isMine
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : 'bg-slate-100 dark:bg-neutral-700 text-slate-900 dark:text-white rounded-bl-md'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-neutral-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 dark:border-neutral-600 bg-slate-50 dark:bg-neutral-700 text-sm text-slate-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-slate-200 dark:text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm text-slate-400">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
