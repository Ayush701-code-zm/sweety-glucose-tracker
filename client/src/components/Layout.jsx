import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" aria-hidden="true" />
          Sweety
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Readings
          </NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
        <div className="user">
          <span>{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
