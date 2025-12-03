// client/src/pages/AdminReferenceManagementPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// Define las configuraciones de los modelos de referencia
const REFERENCE_CONFIGS = {
  roles: {
    endpoint: "accounts/roles/",
    title: "Gestión de Roles",
    keyField: "id_rol",
    nameField: "nombre_rol",
    placeholder: "Ej: Supervisor, Empleado, Administración",
  },
  departamentos: {
    endpoint: "accounts/departamentos/",
    title: "Gestión de Departamentos",
    keyField: "id_departamento",
    nameField: "nombre_area", // Usar nombre_area como campo principal
    secondaryField: "seccion",
    placeholder: "Ej: Marketing, Recursos Humanos",
  },
};

export default function AdminReferenceManagementPage({ type }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [newSecondary, setNewSecondary] = useState("");
  const [saving, setSaving] = useState(false);

  const config = REFERENCE_CONFIGS[type];
  if (!config) return <div>Configuración no válida para {type}</div>;

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [type, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(config.endpoint);
      setData(res.data);
    } catch (e) {
      setError(`Error al cargar ${config.title.toLowerCase()}.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      [config.nameField]: newName.trim(),
    };

    if (config.secondaryField) {
      payload[config.secondaryField] = newSecondary.trim();
    }
    
    // Si estamos creando un Rol, debe tener permisos, aunque sean vacíos.
    if (type === 'roles') {
        payload['permisos'] = {};
    }

    try {
      await api.post(config.endpoint, payload);
      setNewName("");
      setNewSecondary("");
      await loadData();
    } catch (e) {
      const detail = e.response?.data?.non_field_errors?.[0] || e.response?.data?.[config.nameField]?.[0] || "Error al crear.";
      setError(detail);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };
  
  // Función de eliminación (solo si el ViewSet lo permite)
  const handleDelete = async (itemId) => {
      if (!window.confirm(`¿Estás seguro de eliminar el ítem ID ${itemId}?`)) return;
      
      try {
          await api.delete(`${config.endpoint}${itemId}/`);
          await loadData(); // Recarga la lista
      } catch (e) {
          setError("Error al eliminar el ítem. Puede estar en uso.");
          console.error(e);
      }
  };

  if (!isAdmin) {
    return <div style={{ padding: 24 }}>No tenés permisos para ver esta página.</div>;
  }
  
  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: 8 }}>{config.title}</h1>
      <p style={{ marginBottom: 24, color: "#4b5563" }}>
        Administrá las listas de referencia.
      </p>

      {/* Formulario de Creación */}
      <form onSubmit={handleCreate} style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 24, background: '#f9fafb' }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#111827", marginBottom: 16 }}>
            Crear nuevo {config.nameField.split('_')[0]}
        </h2>
        
        {error && <div style={{ marginBottom: 12, color: "#dc2626" }}>{error}</div>}
        
        <div className="auth-field">
          <label>{config.nameField.replace('_', ' ').toUpperCase()}</label>
          <input
            className="auth-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={config.placeholder}
          />
        </div>
        
        {config.secondaryField && (
            <div className="auth-field">
              <label>{config.secondaryField.replace('_', ' ').toUpperCase()} (Opcional)</label>
              <input
                className="auth-input"
                value={newSecondary}
                onChange={(e) => setNewSecondary(e.target.value)}
                placeholder="Ej: Soporte (para Departamento)"
              />
            </div>
        )}

        <button
          className="auth-btn"
          type="submit"
          disabled={saving || !newName.trim()}
          style={{ marginTop: 12, width: '100%', maxWidth: 'none' }}
        >
          {saving ? "Guardando..." : "Crear"}
        </button>
      </form>
      
      {/* Lista de Items */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#111827", marginBottom: 16 }}>Lista Actual</h2>
      {loading && <div>Cargando lista...</div>}
      {data.length === 0 && !loading && <div>No hay elementos registrados.</div>}

      {!loading && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {data.map((item) => (
            <li key={item[config.keyField]} 
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '10px 0', 
                    borderBottom: '1px solid #eee' 
                }}
            >
              <span style={{ color: '#1f2937', fontWeight: 500 }}>
                  {item[config.nameField]} 
                  {config.secondaryField && item[config.secondaryField] && ` (${item[config.secondaryField]})`}
              </span>
              <button 
                  onClick={() => handleDelete(item[config.keyField])} 
                  style={{ 
                      background: 'transparent', 
                      color: '#dc2626', 
                      border: 'none', 
                      cursor: 'pointer' 
                  }}
              >
                  Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}