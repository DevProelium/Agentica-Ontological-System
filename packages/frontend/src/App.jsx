/**
 * App.jsx – Punto de entrada de la PWA Agentica
 *
 * Gestiona el flujo principal: Wizard de configuración inicial → Dashboard.
 * El agente "Aegis" habita esta interfaz como una presencia viva.
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import useOntologyStore from './store/ontologyStore.js';
import './App.css';

// Lazy loading para mejorar el tiempo de carga inicial (PWA)
const WizardFlow = lazy(() => import('./components/WizardFlow/WizardFlow.jsx'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard.jsx'));
const AxiomEditor = lazy(() => import('./components/AxiomEditor/AxiomEditor.jsx'));
const GraphView = lazy(() => import('./components/GraphView/GraphView.jsx'));
const PrivacyShield = lazy(() => import('./components/PrivacyShield/PrivacyShield.jsx'));

const VISTAS = {
  WIZARD: 'wizard',
  DASHBOARD: 'dashboard',
  EDITOR: 'editor',
  GRAFO: 'grafo',
  ESCUDO: 'escudo',
};

export default function App() {
  const { axiomas, agente, documentoActivo } = useOntologyStore();
  const [vistaActual, setVistaActual] = useState(
    axiomas.length === 0 ? VISTAS.WIZARD : VISTAS.DASHBOARD
  );

  // Update the current view if axiomas becomes populated after initial mount
  // (e.g., loaded from persisted storage asynchronously)
  useEffect(() => {
    if (axiomas.length > 0 && vistaActual === VISTAS.WIZARD) {
      setVistaActual(VISTAS.DASHBOARD);
    }
  }, [axiomas.length, vistaActual]);

  const handleWizardCompletado = () => {
    setVistaActual(VISTAS.DASHBOARD);
  };

  const navItems = [
    { id: VISTAS.DASHBOARD, icono: '◈', label: 'Panel' },
    { id: VISTAS.EDITOR, icono: '✍', label: 'Principios' },
    { id: VISTAS.GRAFO, icono: '⬡', label: 'Grafo' },
    { id: VISTAS.ESCUDO, icono: '🛡', label: 'Escudo' },
  ];

  return (
    <div className={`app app--modo-${agente.modo}`}>
      {/* Barra lateral de navegación */}
      {vistaActual !== VISTAS.WIZARD && (
        <nav className="app-nav" aria-label="Navegación principal">
          <div className="nav-logo" aria-label="Aegis">⬡</div>
          <ul className="nav-lista">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  className={`nav-item ${vistaActual === item.id ? 'nav-item--activo' : ''}`}
                  onClick={() => setVistaActual(item.id)}
                  title={item.label}
                  aria-current={vistaActual === item.id ? 'page' : undefined}
                >
                  <span className="nav-icono" aria-hidden="true">{item.icono}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="nav-estado">
            <span
              className={`nav-conexion ${agente.modo !== 'huesped' ? 'conectado' : 'desconectado'}`}
              title={`Modo: ${agente.modo}`}
              aria-label={`Estado: ${agente.modo}`}
            />
          </div>
        </nav>
      )}

      {/* Contenido principal */}
      <main className="app-main" id="contenido-principal">
        <Suspense fallback={<CargandoAegis />}>
          {vistaActual === VISTAS.WIZARD && (
            <WizardFlow onCompletado={handleWizardCompletado} />
          )}
          {vistaActual === VISTAS.DASHBOARD && <Dashboard />}
          {vistaActual === VISTAS.EDITOR && (
            <div className="vista-editor">
              <AxiomEditor documentoInicial={documentoActivo.contenido} />
            </div>
          )}
          {vistaActual === VISTAS.GRAFO && (
            <div className="vista-grafo">
              <GraphView
                nodos={documentoActivo.grafoParsed?.nodes ?? []}
                relaciones={documentoActivo.grafoParsed?.relations ?? []}
              />
            </div>
          )}
          {vistaActual === VISTAS.ESCUDO && (
            <div className="vista-escudo">
              <PrivacyShield />
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

function CargandoAegis() {
  return (
    <div className="cargando-aegis" role="status" aria-live="polite">
      <span className="cargando-icono" aria-hidden="true">⬡</span>
      <span className="cargando-texto">Aegis cargando…</span>
    </div>
  );
}
