import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>MARCAS</h1>
        <button onClick={handleLogout}>Sign out</button>
      </header>
      <hr />
      <h2>Welcome, {user?.name || user?.email}</h2>
      <p>Role: <strong>{user?.role}</strong></p>
      <p>Email: {user?.email}</p>
      <p style={{ color: '#666', marginTop: 40 }}>
        Platform features coming soon. Day 3 development starts here.
      </p>
    </div>
  );
};

export default Dashboard;