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
        <div className="app-logo">TESIS · HR Surveys</div>

        <nav className="app-nav">
          {/* INICIO */}
          <NavLink to="/" end>
            <span>Inicio</span>
          </NavLink>

          {/* ENCUESTAS */}
          <div className="app-group">
            <div className="app-group-title">Encuestas</div>
            <div className="app-subnav">
              <NavLink to="/surveys" end>
                <span>Encuestas</span>
              </NavLink>

              {isAdmin && (
                <>
                  <NavLink to="/surveys/new">
                    <span>Crear encuestas</span>
                  </NavLink>

                  <NavLink to="/surveys/responses">
                    <span>Encuestas respondidas</span>
                  </NavLink>

                  {/* página futura, si querés la usás */}
                  <NavLink to="/surveys/sent">
                    <span>Encuestas enviadas</span>
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {/* USUARIOS – solo admin */}
          {isAdmin && (
            <div className="app-group">
              <div className="app-group-title">Usuarios</div>
              <div className="app-subnav">
                <NavLink to="/admin/usuarios/new">
                  <span>Crear usuario</span>
                </NavLink>
                <NavLink to="/admin/usuarios">
                  <span>Gestión de Usuarios</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* REPORTES – placeholder */}
          {isAdmin && (
            <NavLink to="/reports">
              <span>Reportes</span>
            </NavLink>
          )}

          {/* MI PERFIL */}
          <NavLink to="/me">
            <span>Mi perfil</span>
          </NavLink>
        </nav>

        {/* Usuario + logout */}
        <div className="app-user">
          <div className="app-user-name">{user?.username}</div>
          <button className="app-logout-btn" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
