// client/src/pages/SurveyAssignmentPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // <-- AGREGAR 'useCallback'
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
// Importamos las funciones API necesarias
// Asumiendo que accounts.api.js existe y exporta estas funciones
import { getRoles, getDepartamentos, getUsersList } from '../api/accounts.api'; 

export default function SurveyAssignmentPage() {
    const { id: surveyId } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [assignments, setAssignments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departamentos, setDepartamentos] = useState([]);
    
    // Estado para el formulario de nueva asignación
    const [assignmentTarget, setAssignmentTarget] = useState({ 
        type: 'rol', // 'rol', 'departamento', 'user'
        id: ''      // ID del Rol/Depto/User seleccionado
    });
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.rol?.toLowerCase() === "admin" || user?.is_superuser;

    // --- FUNCIÓN CENTRAL DE CARGA (usamos useCallback para optimizar) ---
    // Mover la lógica de carga fuera del useEffect
    const loadData = useCallback(async () => {
        // No establecer loading a true aquí si ya lo hizo el useEffect, 
        // pero sí si se llama después de crear una asignación.
        // Lo ponemos por si se llama desde el formulario.
        setError(null); 
        try {
            const [rolesRes, deptosRes, assignmentsRes] = await Promise.all([
                getRoles(),
                getDepartamentos(),
                api.get(`surveys/assignments/?survey_id=${surveyId}`),
            ]);

            setRoles(rolesRes.data);
            setDepartamentos(deptosRes.data);
            // Asegúrate de que las respuestas de Django tengan la estructura esperada (data)
            setAssignments(assignmentsRes.data); 

        } catch (e) {
            setError("Error al cargar datos de asignación (Roles/Deptos o Asignaciones).");
            console.error(e);
            throw e; // Lanzar el error para ser manejado por el caller si es necesario
        } 
    }, [surveyId]); // Dependencias: solo surveyId

    // --- Carga Inicial de Listas y Asignaciones Existentes ---
    useEffect(() => {
        if (!isAdmin) {
             setLoading(false); 
             return; 
        }
        
        async function initialLoad() {
            setLoading(true); // Se establece al inicio
            try {
                await loadData();
            } catch (e) {
                // El error ya fue manejado por loadData
            } finally {
                setLoading(false); // Se establece al final, pase lo que pase
            }
        }
        initialLoad();
    }, [isAdmin, loadData]); // Dependencias: isAdmin y loadData (por ser useCallback)


    // --- Manejo del Formulario de Asignación ---
    const handleTargetChange = (e) => {
        const { name, value } = e.target;
        setAssignmentTarget(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setError(null);
        if (!assignmentTarget.id) {
            setError("Debes seleccionar un Rol o Departamento.");
            return;
        }

        setSaving(true);
        let payload = { survey: surveyId };

        if (assignmentTarget.type === 'rol') {
            payload['assigned_rol'] = assignmentTarget.id;
        } else if (assignmentTarget.type === 'departamento') {
            payload['assigned_departamento'] = assignmentTarget.id;
        } // No se maneja 'user' en este ejemplo
        

        try {
            await api.post('surveys/assignments/', payload);
            setAssignmentTarget(prev => ({ ...prev, id: '' })); // Limpiar solo el ID seleccionado
            await loadData(); // ⭐ LLAMADA REUTILIZADA
            // Mostrar un mensaje de éxito si es necesario
        } catch (e) {
            console.error("Error al crear asignación:", e.response?.data);
            // Mostrar error de validación de Django
            const detail = e.response?.data?.non_field_errors?.[0] || e.response?.data?.detail || "Error: Ya existe o los datos son inválidos.";
            setError(detail);
        } finally {
            setSaving(false);
        }
    };
    
    // ... (El resto del código de handleDeleteAssignment y la vista HTML es idéntico) ...


    const handleDeleteAssignment = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta asignación?")) return;
         try {
             await api.delete(`surveys/assignments/${id}/`);
             setAssignments(prev => prev.filter(a => a.id !== id));
         } catch (e) {
             setError("Error al eliminar la asignación.");
             console.error(e);
         }
    };


    if (!isAdmin) {
         return <div style={{ padding: 24, color: '#dc2626' }}>Acceso denegado. Se requiere ser administrador para esta funcionalidad.</div>;
    }
    
    // ⭐ El spinner de carga ahora se mostrará y desaparecerá correctamente
    if (loading) return <div style={{ padding: 24 }}>Cargando asignaciones...</div>;

    // Helper para obtener el texto del objetivo
    const getTargetText = (assignment) => {
        if (assignment.assigned_rol_data) return `ROL: ${assignment.assigned_rol_data.nombre_rol}`;
        if (assignment.assigned_departamento_data) return `DPTO: ${assignment.assigned_departamento_data.nombre_area}`;
        if (assignment.assigned_user_data) return `USUARIO: ${assignment.assigned_user_data.username}`;
        return "Objetivo Desconocido";
    };

    return (
        <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
            <h1 style={{ fontSize: "1.8rem", marginBottom: 8 }}>Administrar Asignaciones</h1>
            <p style={{ marginBottom: 24, color: "#4b5563" }}>
                Encuesta ID {surveyId}. Selecciona a quién estará disponible la encuesta. 
                Si no hay asignaciones, estará disponible para todos los usuarios.
            </p>

            {error && <div style={{ marginBottom: 12, color: "#dc2626", padding: 12, border: '1px solid #dc2626', background: '#fee2e2', borderRadius: 4 }}>{error}</div>}

            {/* --- Formulario de Nueva Asignación --- */}
            <form onSubmit={handleCreateAssignment} style={{ padding: 16, border: '1px solid #3b82f6', borderRadius: 8, marginBottom: 32, background: '#f0f4ff' }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#111827", marginBottom: 12 }}>Crear Nueva Asignación</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    
                    {/* Selector de Tipo de Asignación */}
                    <div className="auth-field">
                        <label>Asignar por</label>
                        <select
                            className="auth-input"
                            name="type"
                            value={assignmentTarget.type}
                            onChange={handleTargetChange}
                        >
                            <option value="rol">Rol</option>
                            <option value="departamento">Departamento</option>
                            {/* <option value="user">Usuario Individual (Avanzado)</option> */}
                        </select>
                    </div>

                    {/* Selector de Objetivo (Rol o Departamento) */}
                    <div className="auth-field">
                        <label>
                            {assignmentTarget.type === 'rol' ? 'Seleccionar Rol' : 'Seleccionar Departamento'}
                        </label>
                        <select
                            className="auth-input"
                            name="id"
                            value={assignmentTarget.id}
                            onChange={handleTargetChange}
                            required
                        >
                            <option value="">-- Seleccionar ID --</option>
                            {assignmentTarget.type === 'rol' && roles.map(r => (
                                // Asegúrate de que el key y el value son correctos según tu API
                                <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                            ))}
                            {assignmentTarget.type === 'departamento' && departamentos.map(d => (
                                // Asegúrate de que el key y el value son correctos según tu API
                                <option key={d.id_departamento} value={d.id_departamento}>{d.nombre_area}</option>
                            ))}
                            {/* Si habilitas la asignación por usuario, cargarías la lista de usuarios aquí */}
                        </select>
                    </div>
                    
                    <button
                        className="auth-btn"
                        type="submit"
                        disabled={saving || !assignmentTarget.id}
                        style={{ marginTop: 12, maxWidth: 300 }}
                    >
                        {saving ? "Creando..." : "Asignar Encuesta"}
                    </button>
                </div>
            </form>
            
            {/* --- Lista de Asignaciones Actuales --- */}
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#111827", marginBottom: 12 }}>Asignaciones Existentes ({assignments.length})</h2>
            
            {assignments.length === 0 && (
                 <p style={{ color: "#4b5563" }}>Esta encuesta no tiene asignaciones. Estará disponible para todos los usuarios.</p>
            )}

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {assignments.map(a => (
                    <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                        <span style={{ color: '#1f2937', fontWeight: 500 }}>
                            {getTargetText(a)}
                        </span>
                        <button 
                            onClick={() => handleDeleteAssignment(a.id)} 
                            style={{ 
                                background: 'transparent', 
                                color: '#dc2626', 
                                border: 'none', 
                                cursor: 'pointer',
                                fontSize: 13,
                                padding: 5
                            }}
                        >
                            Eliminar
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}