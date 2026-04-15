import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';
import type { Notification } from '../services/notificationService';
import { useSocket } from '../context/SocketContext';

export function NotificationBell({ dropUp }: { dropUp?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time: listen for notifications via socket
  useEffect(() => {
    if (!socket) return;
    const handler = () => { fetchNotifications(); };
    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          if (dropUp) {
            navigate('/notifications');
          } else {
            setOpen(!open);
          }
        }}
        className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${dropUp ? 'bottom-full mb-2 right-1/2 translate-x-1/2' : 'right-0 top-full mt-2'} w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-700/80 shadow-lg z-50 overflow-hidden`}>
          <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-700/80 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-neutral-700/80 last:border-0 hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors ${
                    !n.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      {n.link ? (
                        <Link
                          to={n.link}
                          onClick={() => {
                            if (!n.isRead) handleMarkRead(n.id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        </Link>
                      ) : (
                        <div onClick={() => { if (!n.isRead) handleMarkRead(n.id); }} className="cursor-pointer">
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
