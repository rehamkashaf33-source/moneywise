import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeftRight, BarChart3, Bell, Download, Home, LogOut, Menu, Moon, PieChart, Shield, Sun, Target, User, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, download, errMsg } from '../api/client';
import { Avatar } from './ui';

const links = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: PieChart },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/goals', label: 'Savings Goals', icon: Target },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

const titles = { '/': 'Dashboard', '/transactions': 'Transactions', '/budgets': 'Budgets', '/reports': 'Reports', '/goals': 'Savings Goals', '/notifications': 'Notifications', '/profile': 'Profile', '/admin': 'Admin' };

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    let alive = true;
    const poll = () => api.get('/notifications').then(({ data }) => alive && setUnread(data.unread)).catch(() => {});
    poll();
    const id = setInterval(poll, 60000);
    window.addEventListener('notifications:changed', poll);
    return () => { alive = false; clearInterval(id); window.removeEventListener('notifications:changed', poll); };
  }, [pathname]);

  const exportData = () =>
    download('/reports/excel', {}, 'report.xlsx').then(() => toast.success('Export ready')).catch((e) => toast.error(errMsg(e)));

  return (
    <div className="app">
      <div className={`scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <Wallet size={24} />
          <span>Income and Expense Tracker</span>
        </div>
        <div className="profile-box">
          <Avatar user={user} />
          <strong>Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}!</strong>
        </div>
        <nav className="nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}><Icon size={18} />{label}</NavLink>
          ))}
          {user?.role === 'admin' && <NavLink to="/admin"><Shield size={18} />Admin</NavLink>}
        </nav>
        <div className="bottom">
          <button className="btn secondary" onClick={exportData}><Download size={16} />Export data</button>
          <button className="btn ghost" onClick={logout}><LogOut size={16} />Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="btn ghost menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <h1 className="grow">{titles[pathname] || ''}</h1>
          <NavLink to="/notifications" className="btn ghost icon-btn" aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && <span className="badge-dot">{unread > 9 ? '9+' : unread}</span>}
          </NavLink>
          <button className="btn ghost" onClick={toggle} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
