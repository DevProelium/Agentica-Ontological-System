import { useCallback } from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, Info, CheckCircle2, XCircle, Search } from 'lucide-react';
import { analizarMensaje, getIntegrityIndicator } from '../../core/privacyShield.js';
import useOntologyStore from '../../store/ontologyStore.js';

export default function PrivacyShield() {
  const { agente, alertas, agregarAlerta, descartarAlerta } = useOntologyStore();
  const indicador = getIntegrityIndicator(agente.integridad_ontologica);

  const analizarTexto = useCallback((texto, origen = 'usuario') => {
    const resultado = analizarMensaje(texto, { origen });
    if (!resultado.seguro) {
      for (const alerta of resultado.alertas) {
        agregarAlerta({
          id: `alerta-${Date.now()}-${alerta.patron_id}`,
          tipo: 'privacidad',
          nivel: alerta.nivel_alerta,
          mensaje_usuario: alerta.mensaje_usuario,
          nombre_patron: alerta.nombre,
          origen,
          timestamp: new Date().toISOString(),
        });
      }
    }
    return resultado;
  }, [agregarAlerta]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto text-gray-200 h-full">
      <div className="flex items-center gap-3 border-b border-aegis-700 pb-4">
        <Shield size={28} className="text-aegis-accent" />
        <h2 className="text-2xl font-bold tracking-widest text-white">ESCUDO DE PRIVACIDAD</h2>
      </div>

      {/* Indicador de Integridad */}
      <div className="bg-aegis-800 border border-aegis-700 p-6 rounded-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-32 h-32 bg-aegis-accent/5 rounded-full blur-[50px]"></div>
        
        <div className="flex-shrink-0 relative">
          <ShieldCheck size={64} className="text-aegis-accent animate-pulse" />
          {agente.modo === 'seguro' && (
            <span className="absolute -bottom-2 -right-2 bg-green-500/20 border border-green-500 text-green-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              SEGURO
            </span>
          )}
        </div>

        <div className="flex-1 w-full">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-sm text-gray-400 uppercase tracking-widest">Integridad de Bóveda</span>
              <h3 className="text-xl font-semibold capitalize text-aegis-accent">{indicador.nivel}</h3>
            </div>
            <span className="text-2xl font-mono text-white">{(agente.integridad_ontologica * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-aegis-900 rounded-full overflow-hidden border border-aegis-700">
            <div 
              className="h-full bg-aegis-accent shadow-[0_0_10px_rgba(0,230,240,0.8)] transition-all duration-1000"
              style={{ width: `${agente.integridad_ontologica * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-3">{indicador.mensaje}</p>
        </div>
      </div>

      {/* Alertas de Privacidad / Tool Routing requests */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-amber-400 flex items-center gap-2">
            <AlertTriangle size={20} />
            Peticiones Interceptadas ({alertas.length})
          </h3>
          <div className="flex flex-col gap-3">
            {alertas.slice(0, 5).map((alerta) => (
              <div key={alerta.id} className="bg-aegis-800 border-l-4 border-amber-500 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-start gap-4">
                  <span className="mt-1">{nivelAIcono(alerta.nivel)}</span>
                  <div>
                    <h4 className="text-white font-medium">{alerta.mensaje_usuario}</h4>
                    {alerta.origen && <span className="text-xs text-aegis-accent uppercase tracking-wider block mt-1">Origen: {alerta.origen}</span>}
                  </div>
                </div>
                <div className="flex gap-2 self-end md:self-auto shrink-0">
                  <button onClick={() => descartarAlerta(alerta.id)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors text-sm font-medium">
                    <XCircle size={16} /> Bloquear
                  </button>
                  <button onClick={() => descartarAlerta(alerta.id)} className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 transition-colors text-sm font-medium">
                    <CheckCircle2 size={16} /> Permitir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analizador Manual */}
      <AnalyzadorTexto onAnalizar={analizarTexto} />
    </div>
  );
}

function AnalyzadorTexto({ onAnalizar }) {
  const handleAnalizar = (e) => {
    e.preventDefault();
    const texto = e.target.elements.texto.value;
    const origen = e.target.elements.origen.value || 'usuario';
    if (texto.trim()) {
      onAnalizar(texto, origen);
      e.target.reset();
    }
  };

  return (
    <form onSubmit={handleAnalizar} className="mt-auto bg-aegis-800/50 border border-aegis-700 p-6 rounded-xl flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Search size={18} className="text-aegis-accent" />
        <h4 className="font-semibold text-gray-300">Inspección Manual M.C.P. / Peticiones de Herramientas</h4>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <input 
          name="origen" 
          type="text" 
          placeholder="Ej: Crisálida WebSockets" 
          className="bg-aegis-900 border border-aegis-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-aegis-accent focus:ring-1 focus:ring-aegis-accent transition-all w-full md:w-1/3"
        />
        <input 
          name="texto" 
          type="text" 
          placeholder="Tool Request a interceptar (json)..." 
          required
          className="bg-aegis-900 border border-aegis-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-aegis-accent focus:ring-1 focus:ring-aegis-accent transition-all flex-1"
        />
        <button type="submit" className="bg-aegis-accent/10 border border-aegis-accent text-aegis-accent px-6 py-2 rounded-lg font-medium tracking-wide hover:bg-aegis-accent hover:text-aegis-900 transition-all shrink-0">
          ESCANEAR TCP
        </button>
      </div>
    </form>
  );
}

function nivelAIcono(nivel) {
  const cn = 'text-amber-500';
  const cnr = 'text-red-500';
  switch(nivel) {
    case 'bajo': return <Info size={24} className="text-blue-400" />;
    case 'medio': return <AlertTriangle size={24} className={cn} />;
    case 'alto': return <ShieldAlert size={24} className={cnr} />;
    case 'crítico': return <ShieldAlert size={24} className="text-purple-500 animate-pulse" />;
    default: return <AlertTriangle size={24} className={cn} />;
  }
}
