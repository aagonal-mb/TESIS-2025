// client/src/layouts/AppLayout.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout({ children }) {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    signOut();
    nav("/login");
  };

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-logo">HR Surveys</div>

        <nav className="app-nav">
          <NavLink to="/" end>
            Encuestas
          </NavLink>
          <NavLink to="/me">Mi perfil</NavLink>

          {/* Solo para admin / superuser */}
          {isAdmin && (
            <NavLink to="/admin/usuarios">
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="app-user">
          <div className="app-user-name">{user?.username}</div>
          <button className="app-logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}

