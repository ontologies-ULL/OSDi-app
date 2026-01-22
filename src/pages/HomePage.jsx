import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, FileText, Loader, LogOut, User, ChevronDown } from 'lucide-react';
import { Login } from '../components/Login';
import ProjectCard, { 
  DiabetesIcon, 
  HeartDiseaseIcon, 
  CancerIcon, 
  RespiratoryIcon, 
  AlzheimerIcon 
} from '../components/ProjectCard';

const API_BASE_URL = 'http://localhost:8000';

// Array de iconos disponibles
const DISEASE_ICONS = [
  DiabetesIcon,
  HeartDiseaseIcon,
  CancerIcon,
  RespiratoryIcon,
  AlzheimerIcon
];

const ICON_COLORS = ['emerald', 'rose', 'purple', 'blue', 'amber'];

// Función para asignar un icono consistente basado en el nombre
const getIconForProject = (projectName) => {
  // Usar el nombre como seed para generar un índice consistente
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DISEASE_ICONS.length;
  return {
    icon: DISEASE_ICONS[index],
    color: ICON_COLORS[index]
  };
};

function HomePage({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showAllProjects, setShowAllProjects] = useState(false);

  // Verificar si hay un usuario logueado al cargar el componente
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Cargar proyectos cuando el usuario está logueado
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ontology/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error('Error cargando proyectos');
      }
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleCreateProject = async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar ontología desde /public/ontology.owl
      const response = await fetch('/ontology.owl');

      if (!response.ok) {
        throw new Error('No se pudo encontrar el archivo ontology.owl en /public');
      }

      const blob = await response.blob();
      const file = new File([blob], 'ontology.owl', { type: 'application/rdf+xml' });

      // Enviar a la API
      const formData = new FormData();
      formData.append('file', file);

      const apiResponse = await fetch(`${API_BASE_URL}/ontology/load`, {
        method: 'POST',
        body: formData,
      });

      if (apiResponse.ok) {
        // Navegar a la página de crear enfermedad
        setTimeout(() => {
          onNavigate('disease');
        }, 500);
      } else {
        const data = await apiResponse.json();
        setError(data.detail || 'Error cargando ontología');
        setLoading(false);
      }
    } catch (err) {
      setError(
        err.message ||
        'Error al cargar la ontología. Asegúrate de tener ontology.owl en /public y la API corriendo en http://localhost:8000'
      );
      setLoading(false);
    }
  };

  // Si no hay usuario logueado, mostrar el formulario de login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Determinar cuántos proyectos mostrar
  const displayedProjects = showAllProjects ? projects : projects.slice(0, 4);
  const hasMoreProjects = projects.length > 4;

  // Si hay usuario logueado, mostrar el home page
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header con info del usuario y botón de logout */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-100 border-2 border-slate-900 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Bienvenido,</p>
              <p className="text-lg font-semibold text-slate-900">{user.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-xl border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-slate-100 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-2xl mb-6 shadow-lg shadow-emerald-200">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3 tracking-tight">
            Construye tu Modelo de Enfermedad
          </h1>
          <p className="text-xl text-slate-500">
            Esta herramienta interactiva te permitirá crear modelos de evaluación de tecnologías sanitarias de forma clara y flexible.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl flex items-start shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 mr-3 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-rose-900 text-sm font-bold">Error</p>
              <p className="text-rose-700 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Tarjeta Principal */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-300 border border-slate-100 p-10">
          <div className="w-full flex justify-center items-center">
            <button
              onClick={handleCreateProject}
              disabled={loading}
              className="w-1/3 bg-slate-900 text-white py-5 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Cargando ...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Crear Nuevo Proyecto</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid gap-4">
              <div className="flex items-center rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm mr-4 shrink-0">
                  <span className="text-sm text-slate-600">1</span>
                </div>
                <p>Completa los formularios de cada aspecto clave de la enfermedad.</p>
              </div>
              <div className="flex items-center rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm mr-4 shrink-0">
                  <span className="text-sm text-slate-600">2</span>
                </div>
                <p>Se rellenará automáticamente un grafo interactivo que te permite ver tu enfermedad y las relaciones entre sus componentes.</p>
              </div>
              <div className="flex items-center rounded-lg transition-colors">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm mr-4 shrink-0">
                  <span className="text-sm text-slate-600">3</span>
                </div>
                <p>Accede a la fase de evaluación, donde podrás analizar el impacto económico.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Proyectos Anteriores */}
        {projects.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Proyectos Anteriores</h2>
            
            {loadingProjects ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {displayedProjects.map((project) => {
                    const { icon, color } = getIconForProject(project.display_name);
                    return (
                      <ProjectCard
                        key={project.filename}
                        title={project.display_name}
                        icon={icon}
                        color={color}
                        onClick={null} // Sin funcionalidad de clic
                      />
                    );
                  })}
                </div>

                {/* Botón Mostrar Más */}
                {hasMoreProjects && !showAllProjects && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setShowAllProjects(true)}
                      className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 cursor-pointer"
                    >
                      <span className="font-semibold">Mostrar más ({projects.length - 4} proyecto/s)</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Botón Mostrar Menos */}
                {showAllProjects && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setShowAllProjects(false)}
                      className="flex items-center space-x-2 px-6 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-all duration-200 cursor-pointer"
                    >
                      <span className="font-semibold">Mostrar menos</span>
                      <ChevronDown className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Mensaje cuando no hay proyectos */}
        {!loadingProjects && projects.length === 0 && (
          <div className="mt-8 text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No tienes proyectos guardados aún</p>
            <p className="text-slate-400 text-sm mt-1">Crea tu primer proyecto para empezar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;