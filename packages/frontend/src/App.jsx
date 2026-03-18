import { useState, useEffect, Suspense, lazy } from 'react';
import { Hexagon, Shield, Network, Edit3, LayoutDashboard, Radio, TerminalSquare } from 'lucide-react';
import useOntologyStore from './store/ontologyStore.js';
import './App.css';
const WizardFlow = lazy(() => import('./components/WizardFlow/WizardFlow.jsx'));

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard.jsx'));
const AxiomEditor = lazy(() => import('./components/AxiomEditor/AxiomEditor.jsx'));
const GraphView = lazy(() => import('./components/GraphView/GraphView.jsx'));
const PrivacyShield = lazy(() => import('./components/PrivacyShield/PrivacyShield.jsx'));
const EdgeSandbox = lazy(() => import('./components/EdgeSandbox/EdgeSandbox.jsx'));

const VISTAS = { WIZARD: 'wizard', DASHBOARD: 'dashboard', EDITOR: 'editor', GRAFO: 'grafo', ESCUDO: 'escudo', SANDBOX: 'sandbox' };

export default function App() {
  const { axiomas, agente, documentoActivo } = useOntologyStore();
  const [vistaActual, setVistaActual] = useState(axiomas.length === 0 ? VISTAS.WIZARD : VISTAS.DASHBOARD);

  useEffect(() => {
    if (axiomas.length > 0 && vistaActual === VISTAS.WIZARD) setVistaActual(VISTAS.DASHBOARD);
  }, [axiomas, vistaActual]);

  const navItems = [
    { id: VISTAS.DASHBOARD, icono: <LayoutDashboard size={20} />, label: 'Panel' },
    { id: VISTAS.EDITOR, icono: <Edit3 size={20} />, label: 'Principios' },
    { id: VISTAS.GRAFO, icono: <Network size={20} />, label: 'Grafo' },
    { id: VISTAS.ESCUDO, icono: <Shield size={20} />, label: 'Escudo' },
    { id: VISTAS.SANDBOX, icono: <TerminalSquare size={20} />, label: 'Sandbox' },
  ];

  return (
    <div className='flex min-h-screen w-full bg-aegis-900 text-gray-200 font-sans overflow-x-hidden relative'>
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      {vistaActual !== VISTAS.WIZARD && (
        <nav className='w-20 md:w-64 bg-aegis-800/80 border-r border-aegis-700/50 flex flex-col py-8 shadow-[0_0_30px_rgba(0,230,240,0.05)] relative z-20 sticky top-0 h-screen backdrop-blur-md'>
          <div className='flex items-center justify-center md:justify-start gap-3 mb-10 px-6'>
            <Hexagon className='text-aegis-accent animate-pulse shrink-0' size={32} />
            <span className='hidden md:block text-xl font-bold tracking-widest text-white'>AEGIS</span>
          </div>
          <ul className='flex flex-col w-full gap-2 px-3'>
            {navItems.map(item => (
              <li key={item.id} className='w-full'>
                <button
                  className={'w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-lg transition-all duration-300 ' + (vistaActual === item.id ? 'bg-aegis-700 text-aegis-accent shadow-[0_0_15px_rgba(0,230,240,0.15)] border border-aegis-accent/20' : 'text-gray-400 hover:bg-aegis-700/50')}
                  onClick={() => setVistaActual(item.id)}
                  title={item.label}
                >
                  {item.icono}
                  <span className='hidden md:block font-medium'>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className='mt-auto px-6 w-full flex flex-col gap-2'>
            <div className='hidden md:flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest mb-1'>
              <Radio size={14} className={agente.modo !== 'huesped' ? 'text-green-400 animate-pulse' : 'text-gray-600'} />
              Estado Core
            </div>
            <div className={'flex items-center justify-center md:justify-start gap-3 py-2 px-3 rounded-lg border ' + (agente.modo !== 'huesped' ? 'bg-green-400/10 border-green-400/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500')}>
              <div className={'w-2 h-2 rounded-full ' + (agente.modo !== 'huesped' ? 'bg-green-400' : 'bg-gray-600')}></div>
              <span className='hidden md:block text-sm font-medium capitalize'>{agente.modo}</span>
            </div>
          </div>
        </nav>
      )}

      <main className='flex-1 relative p-4 md:p-6 z-10 w-full min-h-screen flex flex-col items-center justify-center'>
        <div className='absolute top-[-5%] right-[-5%] w-96 h-96 bg-aegis-accent/10 rounded-full blur-[120px] pointer-events-none'></div>
        <div className='absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none'></div>


        <div className='relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center'>
          <Suspense fallback={<CargandoAegis />}>
            {vistaActual === VISTAS.WIZARD && <WizardFlow onCompletado={() => setVistaActual(VISTAS.DASHBOARD)} />}
            {vistaActual === VISTAS.DASHBOARD && <div className='flex items-stretch bg-aegis-800/60 backdrop-blur-xl rounded-2xl border border-aegis-700/50 p-4 md:p-6 min-h-[calc(100vh-3rem)] shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,230,240,0.1)]'><Dashboard /></div>}
            {vistaActual === VISTAS.EDITOR && <div className='bg-aegis-800/60 backdrop-blur-xl rounded-2xl border border-aegis-700/50 p-4 md:p-6 w-full shadow-[0_0_40px_rgba(0,0,0,0.5)]'><AxiomEditor documentoInicial={documentoActivo?.contenido || ''} /></div>}
            {vistaActual === VISTAS.GRAFO && <div className='bg-aegis-800/60 backdrop-blur-xl rounded-2xl border border-aegis-700/50 p-4 md:p-6 w-full shadow-[0_0_40px_rgba(0,0,0,0.5)]'><GraphView nodos={documentoActivo?.grafoParsed?.nodes ?? []} relaciones={documentoActivo?.grafoParsed?.relations ?? []} /></div>}
            {vistaActual === VISTAS.ESCUDO && <div className='bg-aegis-800/60 backdrop-blur-xl rounded-2xl border border-aegis-700/50 p-4 md:p-6 w-full shadow-[0_0_40px_rgba(0,0,0,0.5)]'><PrivacyShield /></div>}
            {vistaActual === VISTAS.SANDBOX && <div className='bg-aegis-800/60 backdrop-blur-xl rounded-2xl border border-aegis-700/50 p-4 w-full shadow-[0_0_40px_rgba(0,0,0,0.5)]'><EdgeSandbox /></div>}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function CargandoAegis() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-5 text-aegis-accent' role='status'>
      <Hexagon className='animate-spin' size={56} opacity={0.8} />
      <span className='font-mono tracking-[0.3em] text-sm font-semibold opacity-80'>INICIALIZANDO AEGIS...</span>
    </div>
  );
}
