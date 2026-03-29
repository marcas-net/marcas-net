import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = (import.meta.env['VITE_API_URL'] as string || 'http://localhost:5000/api').replace(/\/api$/, '');
    const s = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('notification', (data: { title: string; message: string }) => {
      toast(data.message, { icon: '🔔', duration: 4000 });
    });

    s.on('document:uploaded', (data: { document: { title: string } }) => {
      toast.success(`New document: ${data.document.title}`, { duration: 3000 });
    });

    s.on('organization:memberJoined', () => {
      toast('A new member joined the organization', { icon: '👋', duration: 3000 });
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
